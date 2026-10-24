// Email-code sign-in for givers (account, fundraisers). No password.
// Mirrors burden-app/src/components/SignIn.jsx.
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Label } from './UI';
import { colors, font } from '../constants/theme';
import { DEMO_CODE, authLive, sendCode, verifyCode } from '../lib/auth';
import { useGifts } from '../context/GiftsContext';

export default function SignIn({ intro, button = 'Sign in' }: { intro?: string; button?: string }) {
  const { signIn } = useGifts();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true); setError('');
    try {
      const e = email.trim().toLowerCase();
      if (!sent) { await sendCode(e); setSent(true); } else await signIn(await verifyCode(e, code.trim()));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {intro && <Text style={styles.intro}>{intro}</Text>}
      <View>
        <Label style={{ marginBottom: 8 }}>Your email</Label>
        <TextInput value={email} onChangeText={setEmail} editable={!sent} autoCapitalize="none" autoComplete="email" autoCorrect={false} spellCheck={false}
          keyboardType="email-address" textContentType="emailAddress" accessibilityLabel="Your email" style={styles.input} />
      </View>
      {sent && (
        <View>
          <Label style={{ marginBottom: 8 }}>The 6-digit code we emailed you</Label>
          <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" textContentType="oneTimeCode" autoFocus
            accessibilityLabel="The 6-digit code we emailed you" style={[styles.input, { letterSpacing: 4 }]} />
          {!authLive && <Text style={styles.hint}>Demo — no email is sent. The code is {DEMO_CODE}.</Text>}
        </View>
      )}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
        <Button disabled={busy || !email} onPress={submit}>{busy ? 'One moment…' : sent ? button : 'Email me a code'}</Button>
        {sent && (
          <Pressable onPress={() => { setSent(false); setCode(''); setError(''); }} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Use another email</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { fontFamily: font.regular, fontSize: 13, lineHeight: 21, color: colors.inkSoft },
  input: {
    borderWidth: 1, borderColor: colors.rule, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: font.regular, fontSize: 15, color: colors.ink,
  },
  hint: { fontFamily: font.regular, fontSize: 12, color: colors.inkMuted, marginTop: 8 },
  error: { fontFamily: font.regular, fontSize: 13, color: colors.fundLow },
  link: { fontFamily: font.regular, fontSize: 12, color: colors.ink, textDecorationLine: 'underline' },
});
