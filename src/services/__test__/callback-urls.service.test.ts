import { describe, expect, it } from "vitest";
import { config } from "~/config.js";
import { checkIfCallbackUrlIsTrusted } from "~/services/callback-urls.service.js";

describe("callback-urls.service", () => {
  describe("checkIfCallbackUrlIsTrusted", () => {
    it("should return true for trusted origins", () => {
      config.trustedOrigins = ["http://trusted.com", "https://trusted.com"];
      expect(checkIfCallbackUrlIsTrusted("http://trusted.com/path")).toBe(true);
      expect(checkIfCallbackUrlIsTrusted("https://trusted.com/path")).toBe(
        true,
      );
    });

    it("should return false for untrusted origins", () => {
      config.trustedOrigins = ["http://trusted.com", "https://trusted.com"];
      expect(checkIfCallbackUrlIsTrusted("http://untrusted.com/path")).toBe(
        false,
      );
      expect(checkIfCallbackUrlIsTrusted("https://untrusted.com/path")).toBe(
        false,
      );
    });

    it("should return true for relative URLs", () => {
      expect(checkIfCallbackUrlIsTrusted("/path")).toBe(true);
      expect(checkIfCallbackUrlIsTrusted("/another/path")).toBe(true);
    });

    it("should return false for invalid relative URLs", () => {
      expect(checkIfCallbackUrlIsTrusted("path")).toBe(false);
      expect(checkIfCallbackUrlIsTrusted("another/path")).toBe(false);
    });

    it("should return false for invalid URLs", () => {
      expect(checkIfCallbackUrlIsTrusted("ftp://trusted.com/path")).toBe(false);
      expect(checkIfCallbackUrlIsTrusted("file:///path")).toBe(false);
    });

    it("should return false for malformed URLs", () => {
      expect(checkIfCallbackUrlIsTrusted("http://")).toBe(false);
      expect(checkIfCallbackUrlIsTrusted("://malformed")).toBe(false);
    });

    it("should return true for URLs with valid special characters", () => {
      expect(
        checkIfCallbackUrlIsTrusted(
          "http://trusted.com/path-_.~!$&'()*+,;=:@%",
        ),
      ).toBe(true);
      expect(checkIfCallbackUrlIsTrusted("/path-_.~!$&'()*+,;=:@%")).toBe(true);
    });

    it("should return false for URLs with spaces", () => {
      expect(checkIfCallbackUrlIsTrusted("/pa th")).toBe(false);
    });

    it("should return false for URLs with invalid protocol", () => {
      expect(checkIfCallbackUrlIsTrusted("ftp://trusted.com/path")).toBe(false);
      expect(checkIfCallbackUrlIsTrusted("file:///path")).toBe(false);
    });

    it("should return false for URLs with missing protocol", () => {
      expect(checkIfCallbackUrlIsTrusted("trusted.com/path")).toBe(false);
      expect(checkIfCallbackUrlIsTrusted("://trusted.com/path")).toBe(false);
    });
  });
});
