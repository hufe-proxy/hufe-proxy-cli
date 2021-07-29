module.exports = (options = {}) => {
  return Object.assign(
    {
      preset: 'ts-jest',
      testEnvironment: 'node',
      testPathIgnorePatterns: ['<rootDir>/test/fixtures'],
      coveragePathIgnorePatterns: ['<rootDir>/test/', '/node_modules/'],
    },
    options
  );
};
