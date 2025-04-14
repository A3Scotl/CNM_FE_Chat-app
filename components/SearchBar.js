import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "react-native-paper";
import { MaterialIcons } from '@expo/vector-icons';

const SearchBar = ({
    searchQuery,
    setSearchQuery,
    setIsSearchFocused,
    colors,
}) => {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            <MaterialIcons
                name="search"
                size={24}
                style={styles.searchIcon}
            />
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: "white",
                        color: colors.text,
                    },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by phone number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearIconContainer}>
                    <MaterialIcons
                        name="close"
                        size={20}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        backgroundColor: 'white',
        borderRadius: 20,
        paddingHorizontal: 15,
        width:300
    },
    input: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
    },
    searchIcon: {
        marginRight: 10,
        color: '#888',
    },
    clearIconContainer: {
        marginLeft: 10,
        color: '#888',
    },
});

export default SearchBar;