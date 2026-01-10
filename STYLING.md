# Styling Guidelines for Antigravity Mobile

## ⚠️ CRITICAL: ChatScreen Must Use StyleSheet

**DO NOT** convert `ChatScreen.tsx` to use NativeWind `className` styling!

### The Problem

When using NativeWind's `className` prop on components in `ChatScreen.tsx`, the app crashes with:

```
Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?
```

This crash occurs specifically when:
1. The user types in the `TextInput` component
2. The component re-renders due to state changes
3. NativeWind's styling engine interferes with React Navigation's context

### The Solution

Use React Native's built-in `StyleSheet.create()` API for all styling in `ChatScreen.tsx`.

```tsx
// ❌ DON'T DO THIS - causes crash
<View className="flex-1 bg-neutral-950">
  <TextInput className="text-white p-4" />
</View>

// ✅ DO THIS INSTEAD - stable
<View style={styles.container}>
  <TextInput style={styles.input} />
</View>

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  input: { color: '#fff', padding: 16 }
});
```

### Why This Happens

NativeWind uses a custom styling engine that processes `className` props at runtime. During TextInput re-renders (which happen on every keystroke), this processing somehow disrupts React Navigation's context resolution, causing the crash.

The exact cause is a compatibility issue between:
- NativeWind's styling engine
- React Navigation's context system
- TextInput's frequent re-render behavior

### Which Screens Are Affected?

| Screen | Can Use NativeWind? | Notes |
|--------|---------------------|-------|
| `ChatScreen.tsx` | ❌ NO | Has TextInput with frequent updates |
| `AuthScreen.tsx` | ⚠️ Risky | Has TextInput, may crash |
| `SettingsScreen.tsx` | ⚠️ Risky | Has TextInputs, may crash |
| `DevScreen.tsx` | ✅ Probably | No TextInput in main flow |
| `HomeScreen.tsx` | ✅ Probably | No TextInput |

### Recommendation

For maximum stability, use `StyleSheet.create()` for **all screens** in this app. The visual difference is negligible, and you avoid any potential NativeWind-related crashes.

---

*Last updated: January 2026*
*Issue discovered during initial development*
