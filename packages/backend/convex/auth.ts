import { authComponent } from "./lib/betterAuth";

export { createAuth } from "./lib/betterAuth/createAuth";

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
