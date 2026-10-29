import { describe, expect, it } from "vitest";
import { SALES_UTM_PARAMS } from "@/config/utm";
import { ERROR_MESSAGES, generateTrackingUrl } from "./tracking-url";

const UTM_QUERY =
  "utm_source=sales_team&utm_medium=direct_sales&utm_campaign=sales_assisted";

function expectTrackingUrl(input: string): string {
  const result = generateTrackingUrl(input);
  if (!result.ok) throw new Error(`Expected success, got: ${result.error}`);
  return result.trackingUrl;
}

function expectError(input: string): string {
  const result = generateTrackingUrl(input);
  if (result.ok) throw new Error(`Expected failure, got: ${result.trackingUrl}`);
  return result.error;
}

function expectSingleStandardUtms(trackingUrl: string) {
  const params = new URL(trackingUrl).searchParams;
  for (const [key, value] of Object.entries(SALES_UTM_PARAMS)) {
    expect(params.getAll(key)).toEqual([value]);
  }
}

describe("generateTrackingUrl — valid NewJaisa URLs", () => {
  it("adds UTM parameters to a standard product URL", () => {
    expect(
      expectTrackingUrl("https://newjaisa.com/products/refurbished-dell-latitude"),
    ).toBe(`https://newjaisa.com/products/refurbished-dell-latitude?${UTM_QUERY}`);
  });

  it("adds UTM parameters to a collection URL", () => {
    expect(
      expectTrackingUrl("https://newjaisa.com/collections/refurbished-laptops"),
    ).toBe(`https://newjaisa.com/collections/refurbished-laptops?${UTM_QUERY}`);
  });

  it("supports the www hostname, the home page, and blog URLs", () => {
    expect(expectTrackingUrl("https://www.newjaisa.com/")).toBe(
      `https://www.newjaisa.com/?${UTM_QUERY}`,
    );
    expect(expectTrackingUrl("https://newjaisa.com")).toBe(
      `https://newjaisa.com/?${UTM_QUERY}`,
    );
    expect(expectTrackingUrl("https://newjaisa.com/blogs/news/buying-guide")).toBe(
      `https://newjaisa.com/blogs/news/buying-guide?${UTM_QUERY}`,
    );
  });

  it("trims surrounding whitespace and accepts an uppercase hostname", () => {
    expect(
      expectTrackingUrl("   https://NewJaisa.com/products/thinkpad-t480 \n"),
    ).toBe(`https://newjaisa.com/products/thinkpad-t480?${UTM_QUERY}`);
  });

  it("preserves existing query parameters before the UTM parameters", () => {
    expect(
      expectTrackingUrl(
        "https://newjaisa.com/collections/refurbished-laptops?sort_by=price-ascending",
      ),
    ).toBe(
      `https://newjaisa.com/collections/refurbished-laptops?sort_by=price-ascending&${UTM_QUERY}`,
    );
  });

  it("preserves a Shopify variant parameter", () => {
    const url = expectTrackingUrl(
      "https://newjaisa.com/products/refurbished-dell-latitude?variant=44012345678901",
    );
    expect(url).toBe(
      `https://newjaisa.com/products/refurbished-dell-latitude?variant=44012345678901&${UTM_QUERY}`,
    );
  });

  it("preserves Shopify collection filters and click identifiers", () => {
    const url = expectTrackingUrl(
      "https://newjaisa.com/collections/laptops?filter.v.price.gte=10000&filter.p.vendor=Dell&gclid=abc123&fbclid=xyz789",
    );
    const params = new URL(url).searchParams;
    expect(params.get("filter.v.price.gte")).toBe("10000");
    expect(params.get("filter.p.vendor")).toBe("Dell");
    expect(params.get("gclid")).toBe("abc123");
    expect(params.get("fbclid")).toBe("xyz789");
    expectSingleStandardUtms(url);
  });

  it("replaces existing UTM values with the Sales Team values", () => {
    const url = expectTrackingUrl(
      "https://newjaisa.com/products/hp-elitebook?variant=123&utm_source=google&utm_medium=cpc&utm_campaign=diwali",
    );
    expect(url).toBe(
      `https://newjaisa.com/products/hp-elitebook?variant=123&${UTM_QUERY}`,
    );
  });

  it("removes other and differently-cased UTM keys so attribution is not mixed", () => {
    const url = expectTrackingUrl(
      "https://newjaisa.com/products/hp-elitebook?UTM_SOURCE=fb&utm_content=ad1&utm_term=laptop&color=black",
    );
    expect(url).toBe(
      `https://newjaisa.com/products/hp-elitebook?color=black&${UTM_QUERY}`,
    );
  });

  it("collapses duplicate UTM parameters into exactly one of each", () => {
    const url = expectTrackingUrl(
      "https://newjaisa.com/collections/laptops?utm_source=a&utm_source=b&utm_medium=x&utm_medium=y&utm_campaign=1&utm_campaign=2&page=2",
    );
    expectSingleStandardUtms(url);
    expect(new URL(url).searchParams.get("page")).toBe("2");
  });

  it("produces exactly one of each UTM parameter when re-run on its own output", () => {
    const once = expectTrackingUrl("https://newjaisa.com/products/macbook-air");
    const twice = expectTrackingUrl(once);
    expect(twice).toBe(once);
    expectSingleStandardUtms(twice);
  });

  it("preserves URL fragments after the query string", () => {
    expect(
      expectTrackingUrl("https://newjaisa.com/pages/faq#warranty"),
    ).toBe(`https://newjaisa.com/pages/faq?${UTM_QUERY}#warranty`);
    expect(
      expectTrackingUrl("https://newjaisa.com/products/x?variant=1#reviews"),
    ).toBe(`https://newjaisa.com/products/x?variant=1&${UTM_QUERY}#reviews`);
  });

  it("returns the normalised original URL alongside the tracking URL", () => {
    const result = generateTrackingUrl("https://newjaisa.com/products/x?variant=1");
    expect(result).toEqual({
      ok: true,
      originalUrl: "https://newjaisa.com/products/x?variant=1",
      trackingUrl: `https://newjaisa.com/products/x?variant=1&${UTM_QUERY}`,
    });
  });
});

describe("generateTrackingUrl — rejected input", () => {
  it("rejects empty input", () => {
    expect(expectError("")).toBe(ERROR_MESSAGES.empty);
    expect(expectError("   ")).toBe(ERROR_MESSAGES.empty);
  });

  it.each([
    "not a url",
    "products/refurbished-dell-latitude",
    "https://",
    "javascript:alert(1)",
    "JavaScript:alert(document.cookie)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://newjaisa.com/file",
  ])("rejects invalid or unsafe URL %s", (input) => {
    expect(expectError(input)).toBe(ERROR_MESSAGES.invalid);
  });

  it("asks for https:// when the protocol is missing from a NewJaisa link", () => {
    expect(expectError("newjaisa.com/products/x")).toBe(
      ERROR_MESSAGES.missingProtocol,
    );
    expect(expectError("www.newjaisa.com")).toBe(ERROR_MESSAGES.missingProtocol);
    expect(expectError("//newjaisa.com/products/x")).toBe(
      ERROR_MESSAGES.missingProtocol,
    );
  });

  it.each([
    "https://google.com/",
    "https://amazon.in/products/refurbished-dell-latitude",
    "https://shop.newjaisa.com/products/x",
    "https://newjaisa.myshopify.com/products/x",
  ])("rejects external domain %s", (input) => {
    expect(expectError(input)).toBe(ERROR_MESSAGES.external);
  });

  it.each([
    "https://newjaisa.com.example.org/products/x",
    "https://newjaisa.co/products/x",
    "https://new-jaisa.com/",
    "https://newjaisa.com.evil.com/",
    "https://evilnewjaisa.com/",
    "https://www.newjaisa.com.attacker.net/",
    "https://xn--newjais-6ya.com/",
    "https://newjaisa.com./products/x",
    "https://newjaisa.com:8443/products/x",
  ])("rejects lookalike domain %s", (input) => {
    expect(expectError(input)).toBe(ERROR_MESSAGES.external);
  });

  it("rejects attacker URLs that merely mention newjaisa.com", () => {
    expect(expectError("https://evil.com/?next=https://newjaisa.com/")).toBe(
      ERROR_MESSAGES.external,
    );
    expect(expectError("https://evil.com/newjaisa.com")).toBe(
      ERROR_MESSAGES.external,
    );
  });

  it.each([
    "http://newjaisa.com/products/refurbished-dell-latitude",
    "http://www.newjaisa.com/",
    "HTTP://newjaisa.com/",
  ])("rejects HTTP URL %s", (input) => {
    expect(expectError(input)).toBe(ERROR_MESSAGES.insecure);
  });

  it.each([
    "https://user:pass@newjaisa.com/products/x",
    "https://user@newjaisa.com/",
    "https://:secret@newjaisa.com/",
    // Looks like newjaisa.com, but the real host is evil.com.
    "https://newjaisa.com@evil.com/",
  ])("rejects URL with embedded credentials %s", (input) => {
    expect(expectError(input)).toBe(ERROR_MESSAGES.credentials);
  });
});
