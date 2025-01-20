const sections = {
	feat: { type: 'feat', section: '🚀 New Feature' },
	style: { type: 'style', section: '💅 Polish' },
	fix: { type: 'fix', section: '🐛 Bug Fix' },
	chore: { type: 'chore', section: '📦 Chores' },
	perf: { type: 'perf', section: '⚡ Performance Improvements' },
	revert: { type: 'revert', section: '⏪ Reverts' },
	docs: { type: 'docs', section: '📝 Documentation' },
	refactor: { type: 'refactor', section: '♻ Code Refactoring' },
	test: { type: 'test', section: '✅ Tests' },
	build: { type: 'build', section: '👷‍ Build System' },
	ci: { type: 'ci', section: '🔧 Continuous Integration | CI' }
};

function getCommitGroupsSort(a, b) {
	const commitGroups = [
		sections.feat.section,
		sections.style.section,
		sections.fix.section,
		sections.refactor.section,
		sections.build.section,
		sections.ci.section,
		sections.chore.section,
		sections.perf.section,
		sections.revert.section,
		sections.docs.section,
		sections.test.section
	];
	const order = commitGroups.map((group) => group.toLowerCase());

	const indexA = order.indexOf(a.title.toLowerCase());
	const indexB = order.indexOf(b.title.toLowerCase());

	if (indexA === -1) return 1;
	if (indexB === -1) return -1;
	return indexA - indexB;
}

module.exports = {
	git: {
		commitMessage: 'chore(release): v${version}',
		tagName: 'v${version}',
		addUntrackedFiles: true
	},
	hooks: {
		'before:init': [],
		'after:bump': ['pnpm run git-info'],
		'after:release':
			'echo Successfully released ${name} v${version} to ${repo.repository}.'
	},
	plugins: {
		'@release-it/conventional-changelog': {
			infile: 'CHANGELOG.md',
			preset: {
				name: 'conventionalcommits',
				header: '# Changelog',
				commitUrlFormat:
					'https://github.com/{{owner}}/{{repository}}/commit/{{hash}}',
				tagPrefix: 'v',
				types: Object.values(sections)
			},
			writerOpts: {
				commitGroupsSort: getCommitGroupsSort
			}
		}
	}
};
