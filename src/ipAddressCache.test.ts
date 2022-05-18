import avaTest, { TestFn } from "ava";
import { generateIpAddress } from "./generateIpAddress";
import { IpAddressCache } from "./ipAddressCache";

const test = avaTest as TestFn<{ ipCache: IpAddressCache }>;

test.beforeEach((t) => {
  t.context = {
    ipCache: new IpAddressCache(),
  };
});

test("it correctly maintains the order of the most frequently seen IP Addresses", (t) => {
  const { ipCache } = t.context;

  ipCache.request_handled("145.87.2.001");

  ipCache.request_handled("145.87.2.002");
  ipCache.request_handled("145.87.2.002");

  ipCache.request_handled("145.87.2.003");
  ipCache.request_handled("145.87.2.003");
  ipCache.request_handled("145.87.2.003");

  const top100 = ipCache.top100();

  // Most Frequent
  t.is(top100[0], "145.87.2.003");

  // Least Frequent
  t.is(top100.slice(-1)[0], "145.87.2.001");
});

test("it inserts new IP Addresses into the frequencyList (top100) if the length is lower than 100", (t) => {
  const { ipCache } = t.context;

  ipCache.request_handled("145.87.2.001");
  ipCache.request_handled("145.87.2.002");
  ipCache.request_handled("145.87.2.003");

  t.is(ipCache.top100().length, 3);
});

test("it maintains the frequencyList (top100) at a length of 100", (t) => {
  const { ipCache } = t.context;

  for (let idx = 0; idx < 1000; idx++) {
    ipCache.request_handled(generateIpAddress());
  }

  t.is(ipCache.top100().length, 100);
});

test("it correctly evicts the last item of the frequencyList (top100) when the length is 100 and another IP Address surpasses its frequency", (t) => {
  const { ipCache } = t.context;

  for (let idx = 0; idx < 1000; idx++) {
    ipCache.request_handled(generateIpAddress());
  }

  const leastFrequentIpAddress = ipCache.top100().slice(-1)[0];

  if (!leastFrequentIpAddress) {
    return t.fail("top100 was empty");
  }

  const leastFrequentIpAddressFrequency = ipCache.getFrequency(
    leastFrequentIpAddress
  );

  const ipAddressToReplaceLeastFrequent = "a-unique-ip-address";

  for (let count = 0; count <= leastFrequentIpAddressFrequency; count++) {
    ipCache.request_handled(ipAddressToReplaceLeastFrequent);
  }

  const updatedLeastFrequentIpAddress = ipCache.top100().slice(-1)[0];

  if (!updatedLeastFrequentIpAddress) {
    return t.fail("top100 was empty");
  }

  // ipAddressToReplaceLeastFrequent actually replaced the last item in the top100
  t.is(updatedLeastFrequentIpAddress, ipAddressToReplaceLeastFrequent);

  // The previous item at top100[99] is no longer anywhere in top100
  t.false(ipCache.top100().includes(leastFrequentIpAddress));
});

test("it clears the internal frequency cache and list", (t) => {
  const { ipCache } = t.context;
  ipCache.request_handled(generateIpAddress());

  t.is(ipCache.top100().length, 1);

  ipCache.clear();

  t.is(ipCache.top100().length, 0);
});

test("if an IP Address has been handled, it retrieves the frequency", (t) => {
  const { ipCache } = t.context;
  const ipAddress = generateIpAddress();
  ipCache.request_handled(ipAddress);

  t.is(ipCache.getFrequency(ipAddress), 1);
});

test("if an IP Address has not been handled, it returns 0 for the frequency", (t) => {
  const { ipCache } = t.context;
  const ipAddress = generateIpAddress();
  ipCache.request_handled(ipAddress);

  t.is(ipCache.getFrequency("a-unhandled-ip-address"), 0);
});
