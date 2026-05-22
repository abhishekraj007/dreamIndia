import { type CnOptions, cnMerge } from "tailwind-variants";

export function cn(...args: CnOptions) {
  return (
    cnMerge(...args)({
      twMerge: true,
      twMergeConfig: {
        classGroups: {
          opacity: [{ opacity: ["disabled"] }],
        },
      },
    }) ?? ""
  );
}
