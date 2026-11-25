import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { path: "/training/register", method: "POST" },
    { path: "/de/training/register", method: "POST" },
    { path: "/en/training/register", method: "POST" },
    { path: "/ru/training/register", method: "POST" },
  ],
});
