/**
 * @param {Object} existing - existing document from DB
 * @param {Object} incoming = data from request body
 * @returns {Object} - only fields that actually changed
 */

export function getChangedFields(existing, incoming) {
    const updates = {};

    for (const key in incoming) {
        if(!incoming.hasOwnProperty(key)) continue;

        const newValue = incoming[key];
        const oldValue = existing[key];

        if(
            (newValue !== undefined && newValue !== null) &&
            (oldValue instanceof Date || newValue instanceof Date ? new Date(newValue).getTime() !== new Date(oldValue).getTime() : newValue !== oldValue) 
        ) {
                updates[key] = newValue;
        }
    }

    return updates;
}