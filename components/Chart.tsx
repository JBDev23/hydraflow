import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { StatsChartData, Theme } from '../types';

type ChartProps = StatsChartData & {
  width?: number;
  height?: number;
  goal?: number;
};

export default function Chart({
  width = 350,
  height = 300,
  rows = 7,
  columns = 7,
  values = [2100, 1000, 1000, 1000, 1000, 1000, 1100],
  colNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  goal = 2100,
  ceil = 100,
}: ChartProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const max = Math.max(...values, 1);

  let divider = max / (rows - 2);
  divider = Math.ceil(divider / ceil) * ceil;

  const rowHeight = (height - height * 0.03) / (rows + 1);

  const rowNums: number[] = [];
  for (let i = 0; i < rows; i++) {
    rowNums[i] = i * divider;
  }

  const renderRows = () => {
    const rowsToRender = [];
    for (let i = rows - 1; i >= 0; i--) {
      rowsToRender.push(
        <View key={i} style={[styles.row, { height: rowHeight }]}>
          <View style={styles.line} />
          <Text style={[styles.rowText, { width: width * 0.15 }]}>{rowNums[i]}</Text>
        </View>,
      );
    }
    return rowsToRender;
  };

  const renderBars = () => {
    const barToRender = [];

    const chartAreaWidth = width * 0.75;
    const barWidth = (chartAreaWidth / columns) * 0.6;
    const spacing = chartAreaWidth / columns;

    for (let i = 0; i < values.length && i < columns; i++) {
      const barHeight = (values[i] / divider) * rowHeight;

      const left = width * 0.025 + i * spacing + (spacing - barWidth) / 2;

      const bottom = rowHeight * 1.5 + 1;

      barToRender.push(
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          key={i}
          style={[
            styles.charBar,
            {
              height: barHeight,
              width: barWidth,
              left,
              bottom,
            },
          ]}
        />,
      );
    }
    return barToRender;
  };

  const renderColNames = () => {
    const colToRender = [];
    const chartAreaWidth = width * 0.75;
    const spacing = chartAreaWidth / columns;

    for (let i = 0; i < colNames.length; i++) {
      colToRender.push(
        <View key={i} style={[{ width: spacing, height: rowHeight, alignItems: 'center' }]}>
          <Text style={styles.colText}>{colNames[i]}</Text>
        </View>,
      );
    }
    return colToRender;
  };

  return (
    <View style={[styles.chartContainer, { height, width, borderWidth: height * 0.015 }]}>
      {renderRows()}

      <View style={[styles.labelsContainer, { width: width * 0.75 }]}>{renderColNames()}</View>

      {renderBars()}
      <View
        style={[
          styles.goalLine,
          { width: width * 0.735, bottom: rowHeight * 1.5 + (goal / divider) * rowHeight },
        ]}
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    chartContainer: {
      borderRadius: 20,
      borderColor: theme.colors.primaryDark,
      paddingHorizontal: 10,
      position: 'relative',
      backgroundColor: theme.colors.background,
      alignSelf: 'center',
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    line: {
      flex: 1,
      height: 2,
      backgroundColor: theme.colors.textTertiary,
      marginRight: 10,
    },
    rowText: {
      fontSize: 17,
      fontFamily: theme.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    labelsContainer: {
      flexDirection: 'row',
      marginTop: -10,
    },
    colText: {
      fontSize: 17,
      fontFamily: theme.regular,
      color: theme.colors.textSecondary,
    },
    charBar: {
      position: 'absolute',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      shadowColor: theme.colors.primaryDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    goalLine: {
      borderBottomWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.primaryDark,
      position: 'absolute',
      left: 10,
      height: 0,
    },
  });
