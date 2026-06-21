import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { getDb } from '../db/database';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.logErrorToDb(error, errorInfo.componentStack);
  }

  async logErrorToDb(error: Error, stack?: string | null) {
    try {
      const db = await getDb();
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS error_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT DEFAULT (datetime('now')),
          error TEXT,
          screen TEXT,
          user_id TEXT
        );
      `);
      await db.runAsync(
        'INSERT INTO error_log (error, screen) VALUES (?, ?)',
        [error.message, stack || 'Unknown']
      );
    } catch (e) {
      console.error('Failed to log error to DB', e);
    }
  }

  handleRestart = () => {
    // Basic recovery attempt
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color="#DC2626" />
            </View>
            <Text style={styles.title}>Oops, something went wrong</Text>
            <Text style={styles.subtitle}>
              The app encountered an unexpected error. This has been logged.
            </Text>
            
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{this.state.error?.message}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
              <RefreshCw size={20} color="#FFF" />
              <Text style={styles.buttonText}>Restart App</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  iconContainer: { marginBottom: 24, padding: 20, backgroundColor: '#FEF2F2', borderRadius: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  errorBox: { width: '100%', backgroundColor: '#F1F5F9', padding: 16, borderRadius: 8, marginBottom: 32 },
  errorText: { fontFamily: 'monospace', fontSize: 12, color: '#334155' },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A2E1A', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 8, gap: 12 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
