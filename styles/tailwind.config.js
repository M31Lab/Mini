/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                bg: 'var(--vscode-editor-background)',
            },
            fontFamily: {
                code: ['var(--vscode-editor-font-family)'],
                DEFAULT: ['var(--vscode-font-family)'],
            },
            fontSize: {
                code: ['var(--vscode-editor-font-size)'],
                '2xs': ['11px', { lineHeight: '1rem' }],
                DEFAULT: ['var(--vscode-font-size)'],
            },
            fontWeight: {
                code: ['var(--vscode-editor-font-weight)'],
                DEFAULT: ['var(--vscode-font-weight)'],
            },
            backgroundColor: {
                DEFAULT: 'var(--vscode-editor-background)',
                secondary: 'var(--vscode-editorWidget-background)',
                sidebar: 'var(--vscode-sideBar-background)',
                tab: {
                    DEFAULT: 'var(--vscode-tab-activeBackground)',
                    'inactive': 'var(--vscode-tab-inactiveBackground)',
                    'inactive-unfocused': 'var(--vscode-tab-unfocusedInactiveBackground)',
                    'active': 'var(--vscode-tab-activeBackground)',
                    'active-unfocused': 'var(--vscode-tab-unfocusedActiveBackground)',
                },
                button: {
                    DEFAULT: 'var(--vscode-button-background)',
                    'hover': 'var(--vscode-button-hoverBackground)',
                    'secondary': 'var(--vscode-button-secondaryBackground)',
                    'secondary-hover': 'var(--vscode-button-secondaryHoverBackground)',
                },
                dropdown: {
                    DEFAULT: 'var(--vscode-dropdown-background)',
                },
                menu: {
                    DEFAULT: 'var(--vscode-menu-background)',
                    'selection': 'var(--vscode-menu-selectionBackground)',
                },
                input: {
                    DEFAULT: 'var(--vscode-settings-textInputBackground)',
                },
                list: {
                    DEFAULT: 'var(--vscode-list-focusBackground)',
                    'focus': 'var(--vscode-list-focusBackground)',
                    'active': 'var(--vscode-list-activeSelectionBackground)',
                    'hover': 'var(--vscode-list-hoverBackground)',
                },
            },
            textColor: {
                DEFAULT: 'var(--vscode-foreground)',
                secondary: 'var(--vscode-editorWidget-foreground)',
                tab: {
                    DEFAULT: 'var(--vscode-tab-activeForeground)',
                    'inactive': 'var(--vscode-tab-inactiveForeground)',
                    'inactive-unfocused': 'var(--vscode-tab-unfocusedInactiveForeground)',
                    'active': 'var(--vscode-tab-activeForeground)',
                    'active-unfocused': 'var(--vscode-tab-unfocusedActiveForeground)',
                },
                button: {
                    DEFAULT: 'var(--vscode-button-foreground)',
                    'secondary': 'var(--vscode-button-secondaryForeground)',
                    'secondary-hover': 'var(--vscode-button-secondaryForeground)',
                },
                link: {
                    DEFAULT: 'var(--vscode-textLink-foreground)',
                    active: 'var(--vscode-textLink-activeForeground)',
                },
                dropdown: {
                    DEFAULT: 'var(--vscode-dropdown-foreground)',
                },
                menu: {
                    DEFAULT: 'var(--vscode-menu-foreground)',
                    'selection': 'var(--vscode-menu-selectionForeground)',
                },
                input: {
                    DEFAULT: 'var(--vscode-settings-textInputForeground)',
                },
                list: {
                    DEFAULT: 'var(--vscode-list-focusForeground)',
                    'focus': 'var(--vscode-list-focusForeground)',
                    'active': 'var(--vscode-list-activeSelectionForeground)',
                    'hover': 'var(--vscode-list-hoverForeground)',
                    invalid: 'var(--vscode-list-invalidItemForeground)',
                    error: 'var(--vscode-list-errorForeground)',
                    warning: 'var(--vscode-list-warningForeground)',
                },
            },
            borderColor: {
                DEFAULT: 'var(--vscode-input-border)',
                secondary: 'var(--vscode-editorWidget-border)',
                tab: {
                    DEFAULT: 'var(--vscode-tab-border)',
                    'inactive': 'var(--vscode-tab-border)',
                    'active': 'var(--vscode-tab-activeBorder)',
                    'active-unfocused': 'var(--vscode-tab-unfocusedActiveBorder)',
                    focus: 'var(--vscode-tab-focusBorder)',
                    'editor-focus': 'var(--vscode-focusBorder)',
                },
                dropdown: {
                    DEFAULT: 'var(--vscode-dropdown-border)',
                },
                menu: {
                    DEFAULT: 'var(--vscode-menu-border)',
                    selection: 'var(--vscode-menu-selectionBorder)',
                },
                input: {
                    DEFAULT: 'var(--vscode-settings-textInputBorder)',
                },
            },
            ringColor: {
                DEFAULT: 'var(--vscode-input-border)',
                tab: {
                    DEFAULT: 'var(--vscode-tab-border)',
                    'inactive': 'var(--vscode-tab-border)',
                    'active': 'var(--vscode-tab-activeBorder)',
                    'active-unfocused': 'var(--vscode-tab-unfocusedActiveBorder)',
                },
            },
            divideColor: {
                DEFAULT: 'var(--vscode-textSeparator-foreground)',
                button: 'var(--vscode-button-separator)',
                menu: 'var(--vscode-menu-separatorBackground)',
            },
            screens: {
                '2xs': '320px',
                'xs': '480px',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
};