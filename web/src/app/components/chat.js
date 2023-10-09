'use client';
import styles from './chat.module.css'

import { useChat } from 'ai/react';

export default function Chat(props) {
    const { messages, input, handleInputChange, handleSubmit } = useChat({
        body: {
            ...props
        }
    });

    return (
        <div className={styles.chat}>
            {messages.map(m => (
                <div key={m.id} className={styles.message + " " + (m.role === 'user' ? styles.user : styles.ai)}>
                    {m.role === 'user' ? 'User: ' : 'NFA: '}
                    {m.content}
                </div>
            ))}

            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    className={styles.input}
                    value={input}
                    onChange={handleInputChange}
                    placeholder='Chat with NFA'
                />
                <button type="submit" className={styles.button}>Send</button>
            </form>
        </div>
    );
}

