window.addEventListener('load', router)
window.addEventListener('hashchange', router)

function router(_event) {
  const currLocation = window.location
  switch (currLocation.hash) {
    case '': {
      window.location.hash = '#/'
      break
    }
    case '#/': {
      readFile('home.md')
      break
    }
    default: {
      readFile(
        window.location.hash.replace('#/', '').replace('.md', '') + '.md'
      )
      break
    }
  }
}

function readFile(file) {
  const isGithub = window.location.origin === 'https://barelyhuman.github.io'
  const repoName = isGithub ? 'babel-plugin-mutable-react-state' : ''
  const url = `${window.location.origin}/${repoName}/pages/${file}`
  fetch(url)
    .then((res) => res.text())
    .then((data) => {
      var parser = new DOMParser()
      var doc = parser.parseFromString(marked.parse(data), 'text/html')
      document.getElementById('app').replaceChildren(doc.body)
      hljs.highlightAll()
    })
}
