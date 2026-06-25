import { Extension, type Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        search: {
            /**
             * @description Set search term in extension.
             */
            setSearchTerm: (searchTerm: string) => ReturnType;
            /**
             * @description Set replace term in extension.
             */
            setReplaceTerm: (replaceTerm: string) => ReturnType;
            /**
             * @description Set case sensitivity in extension.
             */
            setCaseSensitive: (caseSensitive: boolean) => ReturnType;
            /**
             * @description Reset current search result to first instance.
             */
            resetIndex: () => ReturnType;
            /**
             * @description Find next instance of search result.
             */
            nextSearchResult: () => ReturnType;
            /**
             * @description Find previous instance of search result.
             */
            previousSearchResult: () => ReturnType;
            /**
             * @description Replace first instance of search result with given replace term.
             */
            replace: () => ReturnType;
            /**
             * @description Replace all instances of search result with given replace term.
             */
            replaceAll: () => ReturnType;
        };
    }
}
export declare const searchAndReplacePluginKey: PluginKey<any>;
export interface SearchAndReplaceOptions {
    searchResultClass: string;
    disableRegex: boolean;
}
export interface SearchAndReplaceStorage {
    searchTerm: string;
    replaceTerm: string;
    results: Range[];
    lastSearchTerm: string;
    caseSensitive: boolean;
    lastCaseSensitive: boolean;
    resultIndex: number;
    lastResultIndex: number;
}
export declare const SearchAndReplace: Extension<SearchAndReplaceOptions, SearchAndReplaceStorage>;
export default SearchAndReplace;
