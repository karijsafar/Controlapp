export function pageHead(title: string, description: string) {
 return { meta: [{ title: `${title} | CONTROLAPP` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} | CONTROLAPP` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}
