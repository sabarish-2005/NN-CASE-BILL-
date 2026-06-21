import React from 'react';
import { Text, TextStyle } from 'react-native';
import { numberToWords } from '../../utils';

interface Props {
  amount: number;
  style?: TextStyle | TextStyle[];
}

export function AmountInWords({ amount, style }: Props) {
  return (
    <Text style={style}>
      {numberToWords(amount)}
    </Text>
  );
}
