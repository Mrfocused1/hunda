/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./*.html', './*.js', './scripts/**/*.js'],
    theme: {
        extend: {
            fontFamily: {
                display: ['Oswald', 'Inter', 'sans-serif'],
                sans: ['Inter', 'system-ui', 'sans-serif']
            }
        }
    },
    plugins: []
};
