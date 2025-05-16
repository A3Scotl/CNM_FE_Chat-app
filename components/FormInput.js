import React from "react";
import { TextInput, HelperText } from "react-native-paper";

export default function FormInput({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  ...props
}) {
  return (
    <>
      <TextInput
        label={label}
        mode="outlined"
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        error={!!error && touched}
        style={{ marginBottom: 4 }}
        {...props}
      />
      <HelperText type="error" visible={!!error && touched}>
        {error}
      </HelperText>
    </>
  );
}
