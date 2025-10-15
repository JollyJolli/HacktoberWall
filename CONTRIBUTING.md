# 🌟 Contributing to HacktoberWall 🌟

Thank you for your interest in contributing to **HacktoberWall**! 🎉 This project celebrates collaboration and the spirit of Hacktoberfest. Let's get started with some easy-to-follow guidelines!

## 📜 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## 🚀 How to Contribute

1. **Fork the Repository** 🍴: Make a copy of the repository in your GitHub account.

2. **Create a Branch** 🌱: Set up a new branch for your contribution:
   ```bash
   git checkout -b your-branch-name
   ```

3. **Make Changes** ✍️: Modify the code as you like! For general contributions, follow the guidelines below. If you're adding your name, just edit the `contributors.json` file.

4. **Minify CSS and JS** ⚡: To ensure optimal performance, minify your CSS and JS files before submitting them:
   - For CSS, use tools like [cssnano](https://cssnano.co/) or online compressors.
   - For JS, use [UglifyJS](https://github.com/mishoo/UglifyJS) or similar tools.

5. **Add Comments** 📝: Add explanatory comments to your code (use `//` in JavaScript and `/* */` in CSS) to help others understand your logic and decision-making.

6. **Commit Your Changes** 💾: Use the [commitlint](https://commitlint.js.org/) format to create well-structured commit messages. Example:
   ```bash
   git commit -m "fix: resolve issue with navbar layout"
   ```
   Commit message format:
   - `feat`: A new feature
   - `fix`: A bug fix
   - `docs`: Documentation only changes
   - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
   - `refactor`: Code change that neither fixes a bug nor adds a feature
   - `perf`: Code change that improves performance

7. **Submit a Pull Request** 📬: Head over to your repository on GitHub and submit a pull request, describing your changes.

## 🛠️ Code Style

- Maintain a consistent code style throughout the project.
- Ensure your code is clean, well-structured, and well-documented. Use comments to clarify complex sections of the code.
- For HTML, CSS, and JavaScript, adhere to performance best practices such as:
  - **Minifying files** to reduce load times.
  - Avoiding unnecessary complexity.
  - Writing reusable, modular code.

## 🤖 Automated Linting

This project uses automated linting to maintain code quality and consistency:

- **ESLint** for JavaScript: Ensures JavaScript code follows best practices and standards.
- **Stylelint** for CSS: Enforces consistent styling conventions in CSS files.

The linting workflow runs automatically on all pull requests to the main branch. You can also run the linters locally:

```bash
# Run ESLint
npx eslint . --ext .js

# Run Stylelint
npx stylelint "**/*.css"
```

Please ensure your code passes all linting checks before submitting a pull request. This helps maintain code quality and makes the review process smoother.

## 💡 Issues and Improvements

If you spot any issues or have ideas for enhancements, don't hesitate to open an issue on GitHub. Your feedback is valuable! 🗣️ When submitting an issue or feature request, please include as much detail as possible, including steps to reproduce the problem, if applicable.

## ✅ Commit Guidelines

- Follow the [Conventional Commits](https://www.conventionalcommits.org/) standard for writing commit messages. Example formats:
   - `feat: add new dark mode feature`
   - `fix: resolve issue with image loading on mobile`
- This ensures a clean commit history and makes it easier to generate changelogs.

## ⚡ Performance Considerations

- **Minification**: Always minify your CSS and JavaScript to ensure the project remains lightweight and fast.
- **Asset Optimization**: Compress images and other assets to reduce file size and improve performance.
- **Code Efficiency**: Avoid unnecessary loops, functions, or operations that could slow down the project.
  
## 🙌 Acknowledgments

We appreciate every single contribution! Thank you for being a vital part of HacktoberWall! 🌈❤️ Let's build something great together.
