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
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
    personalities,
    type Personality,
} from '@/config'
import type { Mika } from '../Mika'
import OpenAI from 'openai'

type OpenAIMessage = {
    role: 'system' | 'user' | 'assistant'
    content: string
}

class AIManager {
    private readonly ai: GoogleGenAI
    private readonly client: Mika
    private readonly chats: Collection<string, Chat> = new Collection()
    private readonly personality: Collection<string, Personality> =
        new Collection()

    private readonly openai: OpenAI
    private readonly openaiChats: Collection<string, OpenAIMessage[]> =
        new Collection()

    constructor(client: Mika) {
        this.client = client
        // AI
        this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

        this.openai = new OpenAI({
            apiKey: OPENAI_API_KEY,
            baseURL: OPENAI_BASE_URL,
        })
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

    private getOrCreateOpenAIChat(userId: string): OpenAIMessage[] {
        if (this.openaiChats.has(userId)) {
            return this.openaiChats.get(userId)!
        }

        const messages: OpenAIMessage[] = [
            {
                role: 'system',
                content: this.getPersonality(userId),
            },
        ]

        this.openaiChats.set(userId, messages)
        return messages
    }

    public async openaiSendMessage(
        userId: string,
        prompt: string
    ): Promise<string> {
        try {
            const messages = this.getOrCreateOpenAIChat(userId)
            messages.push({
                role: 'user',
                content: prompt,
            })

            const completion = await this.openai.chat.completions.create({
                model: OPENAI_MODEL,
                messages,
                temperature: 1,
            })

            const response =
                completion.choices[0]?.message?.content || 'No response'
            messages.push({
                role: 'assistant',
                content: response,
            })

            return response
        } catch (error) {
            this.client.logger.error(error)
            return 'I am sorry, but I was unable to process your request.'
        }
    }

    public async *openaiSendMessageStream(
        userId: string,
        prompt: string
    ): AsyncGenerator<string, string, unknown> {
        const messages = this.getOrCreateOpenAIChat(userId)
        messages.push({
            role: 'user',
            content: prompt,
        })

        const runner = this.openai.chat.completions.stream({
            model: OPENAI_MODEL,
            messages,
            temperature: 0.9,
            top_p: 0.85,
        })

        let fullResponse = ''

        for await (const chunk of runner) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
                fullResponse += content
                yield content
            }
        }

        messages.push({
            role: 'assistant',
            content: fullResponse,
        })

        return fullResponse
    }

    clearChat(userId: string): boolean {
        let cleared = false
        if (this.chats.has(userId)) {
            this.chats.delete(userId)
            cleared = true
        }
        if (this.openaiChats.has(userId)) {
            this.openaiChats.delete(userId)
            cleared = true
        }
        return cleared
    }

    setPersonality(userId: string, personality: Personality) {
        this.personality.set(userId, personality)
        if (this.chats.has(userId)) {
            this.chats.delete(userId)
        }
        if (this.openaiChats.has(userId)) {
            this.openaiChats.delete(userId)
        }
    }
}

export { AIManager }
