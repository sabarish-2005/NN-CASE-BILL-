import React from 'react';
import { Text, TextStyle } from 'react-native';
import { fmtCurrency } from '../../utils';

interface Props {
  amount: number;
  style?: TextStyle | TextStyle[];
  decimals?: number;
}

export function CurrencyText({ amount, style, decimals = 2 }: Props) {
  return (
    <Text style={style}>
      ₹{fmtCurrency(amount, decimals)}
    </Text>
  );
}
