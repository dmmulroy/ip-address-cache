export class IpAddressCache {
  private frequencyCache: Record<string, number>;
  private frequencyList: string[];
  private readonly FREQUENCY_LIST_MAX_SIZE = 100;

  constructor() {
    this.frequencyCache = {};
    this.frequencyList = [];
  }

  /**
   * Handles caching IP Addresses on a per request basis. The caching algorithm
   * works as follows:
  //  * - If an IP Address is already stored in the frequency cache
  //  * - - Increment the frequency in the frequency cache
  //  * - - If the IP Address is in the frequency list (top100) already
  //  * - - - Call this.sortFrequencyList() to resort the list
  //  * - - Else If the current IP Address has a higher frequency than the last item in the frequency List
  //  * - - - Remove/pop the last item from the frequency list
  //  * - - - Push the current/handled IP Address onto the end of the frequency list
  //  * - Else this is first the IP Address has been seen/handled
  //  * - - Set its frequency to 1 in the frequency cache
  //  * - - If the frequency list is less than the max size (FREQUENCY_LIST_MAX_SIZE)
  //  * - - - Push the current/handled IP Address onto the end of the frequency list
   * @param {string} ipAddress
   * @returns {undefined}
   */
  public request_handled(ipAddress: string): void {
    if (this.frequencyCache[ipAddress]) {
      const updatedFrequency = ++this.frequencyCache[ipAddress];

      if (this.frequencyList.includes(ipAddress)) {
        this.sortFrequencyList();
      } else {
        const minTrackedFrequencyIpAddress = this.frequencyList.slice(-1)[0];

        if (!minTrackedFrequencyIpAddress) {
          throw new DataAccessError(
            "Error accessing IP Address from array where it should have existed"
          );
        }

        const minTrackedFrequency =
          this.frequencyCache[minTrackedFrequencyIpAddress];

        if (!minTrackedFrequency) {
          throw new DataSynchronizationError(
            "IP Address existed in the array but was not found in the cache"
          );
        }

        if (updatedFrequency > minTrackedFrequency) {
          this.frequencyList.pop();
          this.frequencyList.push(ipAddress);
        }
      }
    } else {
      this.frequencyCache[ipAddress] = 1;

      if (this.frequencyList.length < this.FREQUENCY_LIST_MAX_SIZE) {
        this.frequencyList.push(ipAddress);
      }
    }
  }

  /**
   * Returns the top 100 most frequently handled IP Address
   * @returns {Array}
   */
  public top100(): string[] {
    return this.frequencyList;
  }

  /** Clears the internal frequency cache and list
   * @returns {undefined}
   */
  public clear(): void {
    this.frequencyCache = {};
    this.frequencyList = [];
  }

  /**
   * Retrieves the number of times and IP Address has been handled
   * @param ipAddress
   * @returns {number} The frequency that the IP Address has been handled
   */
  public getFrequency(ipAddress: string): number {
    return this.frequencyCache[ipAddress] ?? 0;
  }

  /**
   * Sorts the internal frequency list in descending order
   * @returns {undefined}
   */
  private sortFrequencyList(): void {
    this.frequencyList.sort(
      (a, b) => (this.frequencyCache[b] ?? 0) - (this.frequencyCache[a] ?? 0)
    );
  }
}

class IpAddressCacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = IpAddressCacheError.name;
  }
}

class DataAccessError extends IpAddressCacheError {}

class DataSynchronizationError extends IpAddressCacheError {}
