interface ILavalinkNode {
    name: string
    url: string
    auth: string
    secure: boolean
}

function getNodes(index: number = 0, nodes: ILavalinkNode[] = []) {
    const nodeName = Bun.env[`LAVALINK_NODE_${index}_NAME`]
    if (!nodeName) {
        return nodes
    }

    const lavalinkNode: ILavalinkNode = {
        name: nodeName,
        url: Bun.env[`LAVALINK_NODE_${index}_URL`] || '',
        auth: Bun.env[`LAVALINK_NODE_${index}_AUTH`] || '',
        secure:
            Bun.env[`LAVALINK_NODE_${index}_SECURE`] === 'true' ? true : false,
    }
    nodes.push(lavalinkNode)

    return getNodes(index + 1, nodes)
}

export { getNodes }
