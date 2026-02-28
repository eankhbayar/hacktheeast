import { StyleSheet, View, Text, Button } from 'react-native';
import { useState } from 'react';

export default function HomeScreen() {
  const [content, setContent] = useState('');

  const handleGenerate = async () => {
    // TODO: Call API
    console.log('Generate content');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to My App</Text>
      <Button title="Generate Content" onPress={handleGenerate} />
      {content && <Text style={styles.content}>{content}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    marginTop: 20,
    textAlign: 'center',
  },
});