import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "~/lib/create-app.js";
import { resend } from "~/lib/mail.js";
import { authRouter } from "./auth.routes.js";

vi.mock("~/lib/mail.js");

const client = testClient(createApp().route("/", authRouter));

describe("auth routes", () => {
  it("post /send-magic-link dissallows not valid email addresses", async () => {
    const response = await client.api.auth["signi-in"]["magic-link"].$post({
      json: {
        email: "invalid-email",
        callbackURL: "/home",
      },
    });

    expect(response.status).toBe(422);
    if (response.status !== 422) return;

    const json = await response.json();
    console.log(json);
    expect(json.error.issues[0].path[0]).toBe("email");
  });

  it("post /send-magic-link allows valid email addresses", async () => {
    vi.mocked(resend.emails.send).mockResolvedValue({
      error: null,
      data: null,
    });
    const response = await client.api.auth["signi-in"]["magic-link"].$post({
      json: {
        email: "example@example.com",
        callbackURL: "/home",
      },
    });

    expect(response.status).toBe(200);
    if (response.status !== 200) return;
    expect(await response.json()).toEqual({ success: true });
  });

  it("post /send-magic-link should allow only trusted callback URLs", async () => {
    const response = await client.api.auth["signi-in"]["magic-link"].$post({
      json: {
        email: "example@example.com",
        callbackURL: "http://example.com",
      },
    });

    expect(response.status).toBe(403);
    if (response.status !== 403) return;
    expect(await response.json()).toEqual({
      success: false,
      error: {
        message: "The callback URL is not trusted",
        status: 403,
      },
    });
  });

  it("post /send-magic-link should error out if the email is not sent", async () => {
    vi.mocked(resend.emails.send).mockResolvedValue({
      error: { message: "error", name: "internal_server_error" },
      data: null,
    });

    const response = await client.api.auth["signi-in"]["magic-link"].$post({
      json: {
        email: "example@example.com",
        callbackURL: "/home",
      },
    });

    expect(response.status).toBe(500);
  });
});
