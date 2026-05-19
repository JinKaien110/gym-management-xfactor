export function extractJson(text) {
    if(!text) return text;

    const jsonFence = text.match(/```json\s*([\s\S]*?)\s*```/i);

    if(jsonFence?.[1]) return jsonFence[1].trim()

        const anyFence = text.match(/```\s*([\s\S]*?)\s*```/)
        if(anyFence?.[1]) return anyFence[1].trim()

        const first = text.indexOf("{");
        const last = text.lastIndexOf("}"); 
        if(first !== -1 && last !== -1) return text.slice(first, last + 1).trim();

        return text.trim();
}