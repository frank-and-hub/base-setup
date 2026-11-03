import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Input } from './Input';
import { Button } from './Button';
import { api } from '../lib/api';

interface HostSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HostSettingsModal: React.FC<HostSettingsModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [url, setUrl] = useState<string>(api.getBaseUrl());

  const handleSave = () => {
    api.setBaseUrl(url);
    onClose();
  };

  const handlePreset = (presetUrl: string) => {
    setUrl(presetUrl);
    api.setBaseUrl(presetUrl);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>API Server Configuration</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Configure the NestJS backend API endpoint for mobile device testing:
          </Text>

          <Input
            label="API Base URL"
            value={url}
            onChangeText={setUrl}
            placeholder="http://192.168.1.X:4000/api"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.textMuted }]}>Quick Presets:</Text>
          <View style={styles.presets}>
            <TouchableOpacity
              onPress={() => handlePreset('http://10.0.2.2:4000/api')}
              style={[styles.presetBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontSize: 12 }}>Android Emulator (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handlePreset('http://localhost:4000/api')}
              style={[styles.presetBtn, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.text, fontSize: 12 }}>iOS Sim / Web (localhost)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <Button title="Save & Close" onPress={handleSave} variant="primary" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  presets: {
    gap: 8,
    marginBottom: 20,
  },
  presetBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  actions: {
    marginTop: 8,
  },
});

