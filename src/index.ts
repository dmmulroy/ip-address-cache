import { generateIpAddress } from "./generateIpAddress";
import { IpAddressCache } from "./ipAddressCache";

function main() {
  const ipCache = new IpAddressCache();

  for (let idx = 0; idx < 100_000_000; idx++) {
    const ipAddress = generateIpAddress();

    if (idx % 1_000_000 === 0) {
      console.log(`Progress: ${idx}`);

      console.time("request_handled");
      ipCache.request_handled(ipAddress);
      console.timeEnd("request_handled");
    } else {
      ipCache.request_handled(ipAddress);
    }
  }

  console.time("top100");
  const top100 = ipCache.top100();
  console.timeEnd("top100");

  console.log(
    `Most frequent ip: ${top100[0]}, frequency: ${ipCache.getFrequency(
      top100[0] ?? ""
    )}`
  );
}

main();
