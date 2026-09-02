export enum RepoLanguage {
	JavaScript = 'JavaScript',
	TypeScript = 'TypeScript',
	Svelte = 'Svelte',
	Python = 'Python',
	HTML = 'HTML',
	CSS = 'CSS'
}

export const LanguageColors: Record<RepoLanguage, string> = {
	[RepoLanguage.JavaScript]: '#f1e05a',
	[RepoLanguage.TypeScript]: '#3178c6',
	[RepoLanguage.Svelte]: '#ff3e00',
	[RepoLanguage.Python]: '#3572A5',
	[RepoLanguage.HTML]: '#e34c26',
	[RepoLanguage.CSS]: '#563d7c'
};
