# IP Address Cache

## What would you do differently if you had more time?

Overall, I'm pretty happy with the simplicity and effectiveness of my solution.
I think it scales effectively and is relatively lightweight in its implementation.
However, if I had more time, these are a few things that I would do differently

- Since the frequency list will only ever have a max size of 100, the default v8 implementation of `.sort` is fairly performant but I would like to implement a more efficient sorting algorithim for the list (likely Insertion Sort as it works well for nearly sorted lists).
- A potential future improvement of making the frequency list (top100) configurable rather than static. This could lead to performance concerns however and leads me to my next point.
- If the frequency list was configuring, I'd switch to using a Balanced Tree Structure like an AVL Tree to maintain the ache. This would introduce some drawbacks around the performance of `request_handled` and `top100` (maybe `topN` in this scenario), namely going from O(1) to O(log n) but at the benefit of being able to maintain a full list sorted by frequency for the entire cache.
- In a real production environment I would likely move to off load the caching to a solution like Redis and rely on that rather than storing the cache in application memory.

## What is the runtime complexity of each function?

- `request_handled` runs in O(1) time and benefits from the requirement that we only track the top 100 most frequent addresses. At worst, we insert the IP Address into the frequencyCache (hashmap) O(1) and in some cases resort the frequencyList (array) O(100). O(1 + 100) simplifies to a constant time of O(1).
- `top100` runs in O(1) time simply returns the already sorted frequency list stored in memory.
- `clear` runs in O(1) time as well and simply reassigns the internal data structures allowing the old ones to garbage collected.

## How does your code work?

My general approach to solving this problem was to keep it as simple as possible and take advantage of the fact that we only ever have to track the top 100 most frequent IP addresses (a static value). I utilized two fundamental and basic data structures to implement my solution; an array (`frequencyList`) and a hashmap (`frequencyCache`). The hashmap is responsible for storing the frequency in which we handle each IP Address and has the following type: `Record<string, number>` while the array is responsible for storing the most frequently (or top 100) handled IP Addresses. The "caching algorithim" works as follows when `request_handled` is called:

- If an IP Address is already stored in the `frequencyCache`
  - Increment the frequency in the `frequencyCache`
  - If the IP Address is in the `frequencyList` (top100) already
    - Call `this.sortFrequencyList()` to resort the list
  - Else If the current IP Address has a higher frequency than the last item in the `frequencyList`
    - Remove/pop the last item from the `frequencyList`
    - Push the current/handled IP Address onto the end of the `frequencyList`
- Else this is first the IP Address has been seen/handled
  - Set its frequency to 1 in the `frequencyCache`
  - If the `frequencyList` is less than the max size (`FREQUENCY_LIST_MAX_SIZE`)
    - Push the current/handled IP Address onto the end of the `frequencyList`

Then, because we keep the `frequencyList` sorted during insertion/updating in `request_handled`, when we call `top100` we can simply return the list without any extra processing.

## What other approaches did you decide not to pursue?

I initially considered two other approaches before settling on my current implementation. The fact that we only need to track the top 100 was the deciding factor to not move forward with either as we do not need to maintain order of the entire cache.

- Implement the cache building off the foundations and ideas of an LRU Cache but backing it with a [Skip List](https://brilliant.org/wiki/skip-lists/) rather than just a Doubly Linked List.
- Implement the cache using an AVL Tree.

## How would you test this?

I actually wrote a small test suite to test this and can seen in `src/ipAddressCache.test.ts`, as far as unit testing the test suite covers the following functionality:

- it correctly maintains the order of the most frequently seen IP Addresses
- it inserts new IP Addresses into the frequencyList (top100) if the length is lower than 100
- it maintains the frequencyList (top100) at a length of 100
- it correctly evicts the last item of the frequencyList (top100) when the length is 100 and another IP Address surpasses its frequency
- it clears the internal frequency cache and list
- if an IP Address has been handled, it retrieves the frequency
- if an IP Address has not been handled, it returns 0 for the frequency

Additionally, in `src/index.ts` I have some loose benchmarking to test the performance of `request_handled` and `top100`. I timed the runtime of `request_handled` and `top100` using the [console.time API](https://developer.mozilla.org/en-US/docs/Web/API/console/time). Both had outstanding performance on a 2021 M1 MBP and both averaged ~0.005ms.
