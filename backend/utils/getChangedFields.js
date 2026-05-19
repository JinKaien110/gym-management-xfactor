/**
 * @param {Object} existing - existing document from DB
 * @param {Object} incoming = data from request body
 * @returns {Object} - only fields that actually changed
 */

export function getChangedFields(existing, incoming) {
    const updates = {};

    for (const key in incoming) {
        if (!Object.prototype.hasOwnProperty.call(incoming, key)) continue;

        let newValue = incoming[key];
        let oldValue = existing[key];

        if (newValue === undefined) continue;

        // normalize fake nulls
        if (
            newValue === "" ||
            newValue === "null"
        ) {
            newValue = null;
        }

        if (
            oldValue === "" ||
            oldValue === "null"
        ) {
            oldValue = null;
        }

        const isDate =
            oldValue instanceof Date ||
            newValue instanceof Date;

        const isDifferent = isDate
            ? new Date(newValue).getTime() !== new Date(oldValue).getTime()
            : newValue !== oldValue;

        if (isDifferent) {
            updates[key] = newValue;
        }
    }

    return updates;
}