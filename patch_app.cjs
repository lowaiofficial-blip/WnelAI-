const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const handleRegenerateFn = `
  const handleRegenerateMessage = async (messageId: string) => {
    if (profile?.isBanned || isLoading) return;
    
    // Find the message index
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    // Get the AI message and the user message before it
    const aiMessage = messages[msgIndex];
    if (aiMessage.role !== 'assistant') return;

    // Remove the AI message and all messages after it, effectively resetting state to right after the user prompt
    const newMessages = messages.slice(0, msgIndex);
    setMessages(newMessages);
    
    // Call the API again with the previous messages
    setIsLoading(true);
    isAtBottomRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 20);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          model: selectedModel.id 
        })
      });

      if (!response.ok) throw new Error('API Error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let assistantMessage: Message = { id: Date.now().toString(), role: 'assistant', content: '', isStreaming: true };
        setMessages(prev => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(5));
                assistantMessage.content += data.text;
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  { ...assistantMessage }
                ]);
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
        
        assistantMessage.isStreaming = false;
        setMessages(prev => [
          ...prev.slice(0, -1),
          assistantMessage
        ]);

        if (user && currentChatId) {
          await updateChat(currentChatId, [...newMessages, assistantMessage]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: '*(Bağlantı kesildi veya bir hata oluştu. Lütfen tekrar deneyin.)*' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
`;

const handleSendMessageMatch = '  const handleSendMessage = async (content: string) => {';
const insertionIndex = content.indexOf(handleSendMessageMatch);

if (insertionIndex !== -1) {
  const newContent = content.substring(0, insertionIndex) + handleRegenerateFn + '\n' + content.substring(insertionIndex);
  
  // Now replace <MessageBubble key={message.id} message={message} /> with <MessageBubble key={message.id} message={message} onRegenerate={() => handleRegenerateMessage(message.id)} />
  const finalContent = newContent.replace('<MessageBubble key={message.id} message={message} />', '<MessageBubble key={message.id} message={message} onRegenerate={!isLoading && message.role === "assistant" ? () => handleRegenerateMessage(message.id) : undefined} />');
  
  fs.writeFileSync('src/App.tsx', finalContent);
  console.log('App patched successfully');
} else {
  console.log('Could not find handleSendMessage');
}
