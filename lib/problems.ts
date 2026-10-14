export type Difficulty = "easy" | "medium" | "hard";
export type Status = "not_started" | "attempted" | "solved" | "revisit";

export type Problem = {
  id: string; // unique and stable. Never rename it once students have progress saved.
  title: string;
  difficulty: Difficulty;
  leetcode?: string; // the slug from leetcode.com/problems/<slug>/
  gfg?: string; // full GeeksforGeeks URL (add these yourself)
  core?: boolean; // part of the must-do list
};

export type Topic = {
  id: string;
  name: string;
  description: string;
  problems: Problem[];
};

export const leetcodeUrl = (slug: string) =>
  `https://leetcode.com/problems/${slug}/`;

// Sample starter lists. Replace and extend with your own curated lists.
export const topics: Topic[] = [
  {
    id: "arrays",
    name: "Arrays",
    description: "Traversal, prefix sums, two pointers and in-place tricks.",
    problems: [
      { id: "arrays-two-sum", title: "Two Sum", difficulty: "easy", leetcode: "two-sum", core: true },
      { id: "arrays-best-time-stock", title: "Best Time to Buy and Sell Stock", difficulty: "easy", leetcode: "best-time-to-buy-and-sell-stock", core: true },
      { id: "arrays-contains-duplicate", title: "Contains Duplicate", difficulty: "easy", leetcode: "contains-duplicate" },
      { id: "arrays-product-except-self", title: "Product of Array Except Self", difficulty: "medium", leetcode: "product-of-array-except-self", core: true },
      { id: "arrays-max-subarray", title: "Maximum Subarray", difficulty: "medium", leetcode: "maximum-subarray", core: true },
      { id: "arrays-3sum", title: "3Sum", difficulty: "medium", leetcode: "3sum" },
      { id: "arrays-container-water", title: "Container With Most Water", difficulty: "medium", leetcode: "container-with-most-water" },
    ],
  },
  {
    id: "strings",
    name: "Strings and hashing",
    description: "Frequency maps, sliding windows and string manipulation.",
    problems: [
      { id: "strings-valid-anagram", title: "Valid Anagram", difficulty: "easy", leetcode: "valid-anagram", core: true },
      { id: "strings-group-anagrams", title: "Group Anagrams", difficulty: "medium", leetcode: "group-anagrams" },
      { id: "strings-longest-substring", title: "Longest Substring Without Repeating Characters", difficulty: "medium", leetcode: "longest-substring-without-repeating-characters", core: true },
      { id: "strings-longest-palindrome", title: "Longest Palindromic Substring", difficulty: "medium", leetcode: "longest-palindromic-substring" },
    ],
  },
  {
    id: "linked-lists",
    name: "Linked lists",
    description: "Pointer manipulation, cycles and merging.",
    problems: [
      { id: "ll-reverse", title: "Reverse Linked List", difficulty: "easy", leetcode: "reverse-linked-list", core: true },
      { id: "ll-cycle", title: "Linked List Cycle", difficulty: "easy", leetcode: "linked-list-cycle", core: true },
      { id: "ll-merge-two", title: "Merge Two Sorted Lists", difficulty: "easy", leetcode: "merge-two-sorted-lists", core: true },
      { id: "ll-remove-nth", title: "Remove Nth Node From End of List", difficulty: "medium", leetcode: "remove-nth-node-from-end-of-list" },
    ],
  },
  {
    id: "trees",
    name: "Trees",
    description: "Traversals, recursion on trees and binary search trees.",
    problems: [
      { id: "trees-max-depth", title: "Maximum Depth of Binary Tree", difficulty: "easy", leetcode: "maximum-depth-of-binary-tree", core: true },
      { id: "trees-invert", title: "Invert Binary Tree", difficulty: "easy", leetcode: "invert-binary-tree" },
      { id: "trees-validate-bst", title: "Validate Binary Search Tree", difficulty: "medium", leetcode: "validate-binary-search-tree", core: true },
      { id: "trees-level-order", title: "Binary Tree Level Order Traversal", difficulty: "medium", leetcode: "binary-tree-level-order-traversal" },
    ],
  },
  {
    id: "dp",
    name: "Dynamic programming",
    description: "Break problems into overlapping subproblems.",
    problems: [
      { id: "dp-climbing-stairs", title: "Climbing Stairs", difficulty: "easy", leetcode: "climbing-stairs", core: true },
      { id: "dp-house-robber", title: "House Robber", difficulty: "medium", leetcode: "house-robber", core: true },
      { id: "dp-coin-change", title: "Coin Change", difficulty: "medium", leetcode: "coin-change", core: true },
      { id: "dp-lis", title: "Longest Increasing Subsequence", difficulty: "medium", leetcode: "longest-increasing-subsequence" },
    ],
  },
  {
    id: "graphs",
    name: "Graphs",
    description: "BFS, DFS, grids and dependency ordering.",
    problems: [
      { id: "graphs-islands", title: "Number of Islands", difficulty: "medium", leetcode: "number-of-islands", core: true },
      { id: "graphs-clone", title: "Clone Graph", difficulty: "medium", leetcode: "clone-graph" },
      { id: "graphs-course-schedule", title: "Course Schedule", difficulty: "medium", leetcode: "course-schedule", core: true },
    ],
  },
];

// Places to practise language basics. Check each one before launch.
export const languageResources = [
  { name: "HackerRank", url: "https://www.hackerrank.com/", note: "Beginner tracks and small problems in many languages." },
  { name: "Exercism", url: "https://exercism.org/", note: "Free exercises for each language, with optional mentor feedback." },
  { name: "freeCodeCamp", url: "https://www.freecodecamp.org/", note: "Free structured courses with built-in exercises." },
  { name: "CodeChef Practice", url: "https://www.codechef.com/practice", note: "Beginner problems sorted by difficulty." },
];