/**
 * Authentication Screen - React Native implementation
 * Uses shared authentication hooks from @groupi/shared
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import shared business logic
import { createAuthHooks } from '@groupi/shared/hooks';
import {
  validateEmail,
  validateRequired,
  createFormField,
  validateForm,
  createButtonA11yProps,
  createTextInputA11yProps,
} from '@groupi/shared';

import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../App';
import type { ConvexApi } from '@groupi/shared/hooks';

// Placeholder API until Convex is integrated - returns empty hooks for now

const mockApi = {} as ConvexApi;
const authHooks = createAuthHooks(mockApi);

type AuthScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Auth'
>;

export function AuthScreen() {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(createFormField());
  const [password, setPassword] = useState(createFormField());
  const [firstName, setFirstName] = useState(createFormField());
  const [lastName, setLastName] = useState(createFormField());

  // Use shared auth hooks
  const { isAuthenticated } = authHooks.useAuthState();
  const loginFn = authHooks.useLogin();
  const signupFn = authHooks.useSignup();

  // Navigate to home if authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Home');
    }
  }, [isAuthenticated, navigation]);

  const handleSubmit = async () => {
    const fields = { email, password, firstName, lastName };
    const validators = {
      email: (value: string) => {
        if (!validateRequired(value)) return 'Email is required';
        if (!validateEmail(value)) return 'Please enter a valid email';
        return null;
      },
      password: (value: string) => {
        if (!validateRequired(value)) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
      ...(isLogin
        ? {}
        : {
            firstName: (value: string) =>
              validateRequired(value) ? null : 'First name is required',
            lastName: (value: string) =>
              validateRequired(value) ? null : 'Last name is required',
          }),
    };

    const validation = validateForm(fields, validators);

    if (!validation.isValid) {
      Alert.alert('Validation Error', Object.values(validation.errors)[0]);
      return;
    }

    try {
      if (isLogin) {
        await loginFn({
          email: email.value,
          password: password.value,
        });
      } else {
        await signupFn({
          email: email.value,
          password: password.value,
          firstName: firstName.value,
          lastName: lastName.value,
        });
      }
    } catch (_error) {
      Alert.alert(
        'Authentication Error',
        'Please check your credentials and try again'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to continue' : 'Join Groupi today'}
        </Text>

        <View style={styles.form}>
          {!isLogin && (
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder='First Name'
                value={firstName.value}
                onChangeText={text =>
                  setFirstName({ ...firstName, value: text })
                }
                autoCapitalize='words'
                {...createTextInputA11yProps('First Name', { required: true })}
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder='Last Name'
                value={lastName.value}
                onChangeText={text => setLastName({ ...lastName, value: text })}
                autoCapitalize='words'
                {...createTextInputA11yProps('Last Name', { required: true })}
              />
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder='Email'
            value={email.value}
            onChangeText={text => setEmail({ ...email, value: text })}
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            {...createTextInputA11yProps('Email address', { required: true })}
          />

          <TextInput
            style={styles.input}
            placeholder='Password'
            value={password.value}
            onChangeText={text => setPassword({ ...password, value: text })}
            secureTextEntry
            autoCapitalize='none'
            autoCorrect={false}
            {...createTextInputA11yProps('Password', { required: true })}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            {...createButtonA11yProps(isLogin ? 'Sign In' : 'Create Account')}
          >
            <Text style={styles.submitButtonText}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
            {...createButtonA11yProps(
              isLogin ? 'Switch to create account' : 'Switch to sign in'
            )}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.background,
    fontSize: 16,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    height: 50,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchButtonText: {
    color: Colors.light.primary,
    fontSize: 14,
  },
});
