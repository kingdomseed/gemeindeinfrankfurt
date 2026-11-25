import { createServerClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";

import type { CoordinatorClient } from "@/lib/auth";
import type { ReceiptStore } from "@/lib/receipt-store";
import { addReimbursement, attachReceipt, loadReport, removeReimbursement } from "@/lib/report";
import type { Database } from "@/lib/supabase/database.types";

type FetchHandler = (req: Request) => Promise<Response> | Response;

function stubCoordinatorClient(handler: FetchHandler): CoordinatorClient {
  return createServerClient<Database>("http://localhost:54321", "anon-key", {
    cookies: { getAll: () => [], setAll: () => {} },
    global: {
      fetch: (input, init) => Promise.resolve(handler(new Request(input, init))),
    },
  });
}

function fakeReceiptStore(opts?: { signed?: Record<string, string>; uploadedPath?: string }): {
  store: ReceiptStore;
  signedCalls: string[][];
  uploaded: { trainingId: string; type: string }[];
  removed: string[];
} {
  const signedCalls: string[][] = [];
  const uploaded: { trainingId: string; type: string }[] = [];
  const removed: string[] = [];
  const store: ReceiptStore = {
    signUrls(paths) {
      signedCalls.push([...paths]);
      const links = new Map<string, string>();
      for (const path of paths) {
        const url = opts?.signed?.[path];
        if (url) links.set(path, url);
      }
      return Promise.resolve(links);
    },
    upload(trainingId, photo) {
      uploaded.push({ trainingId, type: photo.type });
      return Promise.resolve(opts?.uploadedPath ?? `${trainingId}/uploaded.png`);
    },
    remove(path) {
      removed.push(path);
      return Promise.resolve();
    },
  };
  return { store, signedCalls, uploaded, removed };
}

const TRAINING_ID = "11111111-1111-4111-8111-111111111111";

describe("loadReport and reimbursement receipt storage", () => {
  it("loads report data and signs only non-null receipt paths", async () => {
    const fake = fakeReceiptStore({
      signed: { "t/receipt-1.png": "https://cdn.example/signed-1.png" },
    });
    const client = stubCoordinatorClient((req) => {
      const url = new URL(req.url);
      if (url.pathname.endsWith("/training_reports")) {
        return Response.json(null);
      }
      if (url.pathname.endsWith("/localities")) {
        return Response.json({ name: "Frankfurt am Main" });
      }
      if (url.pathname.endsWith("/registrations")) {
        return Response.json([{ status: "active", other_locality: "Mainz", localities: null }]);
      }
      if (url.pathname.endsWith("/reimbursements")) {
        return Response.json([
          {
            id: "c1",
            description: "Printouts",
            amount_cents: 1200,
            paid_by: "Coord A",
            paid_on: "2027-01-12",
            receipt_path: "t/receipt-1.png",
          },
          {
            id: "c2",
            description: "Water",
            amount_cents: 500,
            paid_by: "Coord B",
            paid_on: null,
            receipt_path: null,
          },
        ]);
      }
      if (url.pathname.endsWith("/test_slots")) {
        return new Response(null, { status: 200, headers: { "Content-Range": "*/2" } });
      }
      return new Response("Not found", { status: 404 });
    });

    const data = await loadReport(client, TRAINING_ID, fake.store);
    expect(fake.signedCalls).toEqual([["t/receipt-1.png"]]);
    expect(data.testsPlanned).toBe(2);
    expect(data.localities).toEqual(["Mainz"]);
    expect(data.reimbursements).toEqual([
      {
        id: "c1",
        description: "Printouts",
        amountCents: 1200,
        paidBy: "Coord A",
        paidOn: "2027-01-12",
        photoUrl: "https://cdn.example/signed-1.png",
      },
      {
        id: "c2",
        description: "Water",
        amountCents: 500,
        paidBy: "Coord B",
        paidOn: null,
        photoUrl: null,
      },
    ]);
  });

  it("cleans up the uploaded receipt if inserting a reimbursement fails", async () => {
    const fake = fakeReceiptStore({ uploadedPath: `${TRAINING_ID}/orphan.png` });
    let insertedBody: unknown = null;
    const failingClient = stubCoordinatorClient(async (req) => {
      insertedBody = await req.json();
      return Response.json({ message: "db insert failed" }, { status: 400 });
    });

    const photo = new File(["img"], "receipt.png", { type: "image/png" });
    await expect(
      addReimbursement(
        failingClient,
        TRAINING_ID,
        {
          description: "Folders",
          amountCents: 850,
          paidBy: "Coord A",
          paidOn: null,
          photo,
        },
        fake.store,
      ),
    ).rejects.toMatchObject({ message: "db insert failed" });

    expect(fake.uploaded).toEqual([{ trainingId: TRAINING_ID, type: "image/png" }]);
    expect(insertedBody).toMatchObject({ receipt_path: `${TRAINING_ID}/orphan.png` });
    expect(fake.removed).toEqual([`${TRAINING_ID}/orphan.png`]);
  });

  it("replaces old receipt on attachReceipt and cleans up new upload on update error", async () => {
    const okFake = fakeReceiptStore({ uploadedPath: `${TRAINING_ID}/new.webp` });
    const okClient = stubCoordinatorClient((req) => {
      if (req.method === "GET") {
        return Response.json({ training_id: TRAINING_ID, receipt_path: `${TRAINING_ID}/old.jpg` });
      }
      return new Response(null, { status: 204 });
    });
    await attachReceipt(
      okClient,
      "cost-1",
      new File(["img"], "new.webp", { type: "image/webp" }),
      okFake.store,
    );
    expect(okFake.uploaded).toEqual([{ trainingId: TRAINING_ID, type: "image/webp" }]);
    expect(okFake.removed).toEqual([`${TRAINING_ID}/old.jpg`]);

    const failFake = fakeReceiptStore({ uploadedPath: `${TRAINING_ID}/abandoned.png` });
    const failClient = stubCoordinatorClient((req) => {
      if (req.method === "GET") {
        return Response.json({ training_id: TRAINING_ID, receipt_path: `${TRAINING_ID}/keep.jpg` });
      }
      return Response.json({ message: "update failed" }, { status: 400 });
    });
    await expect(
      attachReceipt(
        failClient,
        "cost-1",
        new File(["img"], "fail.png", { type: "image/png" }),
        failFake.store,
      ),
    ).rejects.toMatchObject({ message: "update failed" });
    expect(failFake.removed).toEqual([`${TRAINING_ID}/abandoned.png`]);
  });

  it("removes stored receipt when deleting a reimbursement", async () => {
    const fake = fakeReceiptStore();
    const client = stubCoordinatorClient(() =>
      Response.json({ receipt_path: `${TRAINING_ID}/gone.png` }),
    );
    await removeReimbursement(client, "cost-1", fake.store);
    expect(fake.removed).toEqual([`${TRAINING_ID}/gone.png`]);
  });

  it("skips signing URLs when no reimbursements have receipts", async () => {
    const fake = fakeReceiptStore();
    const client = stubCoordinatorClient((req) => {
      const url = new URL(req.url);
      if (url.pathname.endsWith("/training_reports")) return Response.json(null);
      if (url.pathname.endsWith("/localities")) return Response.json(null);
      if (url.pathname.endsWith("/registrations")) return Response.json([]);
      if (url.pathname.endsWith("/reimbursements")) return Response.json([]);
      if (url.pathname.endsWith("/test_slots")) {
        return new Response(null, { status: 200, headers: { "Content-Range": "*/0" } });
      }
      return new Response("Not found", { status: 404 });
    });

    const data = await loadReport(client, TRAINING_ID, fake.store);
    expect(fake.signedCalls).toEqual([]);
    expect(data.reimbursements).toEqual([]);
  });

  it("treats post-commit receipt removal errors as best-effort", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const fake = fakeReceiptStore({ uploadedPath: `${TRAINING_ID}/next.png` });
      const store: ReceiptStore = {
        ...fake.store,
        remove: () => Promise.reject(new Error("storage offline")),
      };

      const replaceClient = stubCoordinatorClient((req) =>
        req.method === "GET"
          ? Response.json({ training_id: TRAINING_ID, receipt_path: `${TRAINING_ID}/stale.jpg` })
          : new Response(null, { status: 204 }),
      );
      await expect(
        attachReceipt(
          replaceClient,
          "cost-1",
          new File(["img"], "next.png", { type: "image/png" }),
          store,
        ),
      ).resolves.toBeUndefined();

      const deleteClient = stubCoordinatorClient(() =>
        Response.json({ receipt_path: `${TRAINING_ID}/stale.jpg` }),
      );
      await expect(removeReimbursement(deleteClient, "cost-1", store)).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(2);
    } finally {
      warn.mockRestore();
    }
  });
});
