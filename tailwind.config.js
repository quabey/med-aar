/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],

	theme: {
		extend: {
			screens: {
				'3xl': '1920px'
			},
			colors: {
				'primary-900': '#170602',
				'primary-800': '#461307',
				'primary-700': '#741F0C',

				// primary 600 is the official Medrunner red
				'primary-600': 'rgb(44 82 120)',

				'primary-500': '#D13815',
				'primary-400': '#EA512E',
				'primary-300': '#EF785D',
				'primary-200': '#F39F8B',
				'primary-100': '#F8C5B9',
				'primary-50': '#FDECE8'
			},
			fontFamily: {
				Mohave: ['Mohave', 'sans-serif'],
				Inter: ['Inter', 'sans-serif']
			}
		}
	},
	plugins: [require('flowbite/plugin')]
};
