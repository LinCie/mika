import { Collection } from 'discord.js'
import {
    Chat,
    GoogleGenAI,
    HarmBlockThreshold,
    HarmCategory,
} from '@google/genai'
import {
    GEMINI_API_KEY,
    GEMINI_MODEL,
    personalities,
    type Personality,
} from '@/config'
import type { Mika } from '../Mika'

class AIManager {
    private readonly ai: GoogleGenAI
    private readonly client: Mika
    private readonly chats: Collection<string, Chat> = new Collection()
    private readonly personality: Collection<string, Personality> =
        new Collection()

    constructor(client: Mika) {
        this.client = client
        // AI
        this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
    }

    private getPersonality(userId: string): string {
        if (this.personality.has(userId)) {
            const personality = this.personality.get(userId)!
            return personalities[personality]
        }
        return personalities.mika
    }

    private getOrCreateChat(userId: string): Chat {
        if (this.chats.has(userId)) {
            return this.chats.get(userId)!
        }

        const chat = this.ai.chats.create({
            model: GEMINI_MODEL || 'gemini-2.5-flash',
            config: {
                temperature: 1,

                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold: HarmBlockThreshold.OFF,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                        threshold: HarmBlockThreshold.OFF,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.OFF,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.OFF,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.OFF,
                    },
                ],

                systemInstruction: this.getPersonality(userId),
            },
        })

        this.chats.set(userId, chat)
        return chat
    }

    public async sendMessage(userId: string, prompt: string): Promise<string> {
        const chat = this.getOrCreateChat(userId)
        try {
            const result = await chat.sendMessage({ message: prompt })
            return (
                result.text ||
                result.promptFeedback?.blockReason ||
                'No response'
            )
        } catch (error) {
            this.client.logger.error(error)
            return 'I am sorry, but I was unable to process your request.'
        }
    }

    clearChat(userId: string): boolean {
        if (this.chats.has(userId)) {
            this.chats.delete(userId)
            return true
        }
        return false
    }

    setPersonality(userId: string, personality: Personality) {
        this.personality.set(userId, personality)
        if (this.chats.has(userId)) {
            this.chats.delete(userId)
        }
    }
}

export { AIManager }
