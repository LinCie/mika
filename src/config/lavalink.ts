import type { NodeOption } from 'shoukaku'

const LAVALINK_READY_TIMEOUT_MS = 120_000
const LAVALINK_READY_INTERVAL_MS = 2_000
const LAVALINK_READY_REQUEST_TIMEOUT_MS = 5_000

function getNodes(index: number = 0, nodes: NodeOption[] = []) {
    const nodeName = Bun.env[`LAVALINK_NODE_${index}_NAME`]
    if (!nodeName) {
        return nodes
    }

    const lavalinkNode: NodeOption = {
        name: nodeName,
        url: Bun.env[`LAVALINK_NODE_${index}_URL`] || '',
        auth: Bun.env[`LAVALINK_NODE_${index}_AUTH`] || '',
        secure:
            Bun.env[`LAVALINK_NODE_${index}_SECURE`] === 'true' ? true : false,
    }
    nodes.push(lavalinkNode)

    return getNodes(index + 1, nodes)
}

function getLavalinkInfoUrl(node: NodeOption) {
    const protocol = node.secure ? 'https' : 'http'
    return `${protocol}://${node.url}/v4/info`
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function probeLavalinkNode(node: NodeOption) {
    const abortController = new AbortController()
    const timeout = setTimeout(
        () => abortController.abort(),
        LAVALINK_READY_REQUEST_TIMEOUT_MS
    )

    try {
        const response = await fetch(getLavalinkInfoUrl(node), {
            headers: {
                Authorization: node.auth,
            },
            signal: abortController.signal,
        })

        if (!response.ok) {
            throw new Error(
                `Lavalink node ${node.name} returned ${response.status}`
            )
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function waitForLavalinkNode(node: NodeOption) {
    const startedAt = Date.now()
    let lastError: unknown

    while (Date.now() - startedAt < LAVALINK_READY_TIMEOUT_MS) {
        try {
            await probeLavalinkNode(node)
            return
        } catch (error) {
            lastError = error
            await sleep(LAVALINK_READY_INTERVAL_MS)
        }
    }

    throw new Error(
        `Timed out waiting for Lavalink node ${node.name} to become ready`,
        {
            cause: lastError,
        }
    )
}

async function waitForLavalinkNodes(nodes: NodeOption[]) {
    await Promise.all(nodes.map((node) => waitForLavalinkNode(node)))
}

export { getNodes, waitForLavalinkNodes }
