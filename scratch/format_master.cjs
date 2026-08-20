const fs = require('fs');
const path = require('path');

const dir = 'd:/project-management/src/components/master';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix deleting -> isDeleting
  if (content.includes('const [deleting, setDeleting]')) {
    content = content.replace(/const \[deleting, setDeleting\] = useState\(false\);/g, 'const [isDeleting, setIsDeleting] = useState(false);');
    content = content.replace(/setDeleting\(/g, 'setIsDeleting(');
    content = content.replace(/isLoading=\{deleting\}/g, 'isLoading={isDeleting}');
    changed = true;
  }

  // Fix form.Field children prop to JSX children
  const fieldRegex = /<form\.Field\s+name=("[^"]+")\s+children=\{((?:.|\n|\r)*?)\}\s*\/>/g;
  if (fieldRegex.test(content)) {
    content = content.replace(fieldRegex, '<form.Field name=$1>\n              {$2}\n            </form.Field>');
    changed = true;
  }

  // Fix form.Subscribe children prop to JSX children
  const subscribeRegex = /<form\.Subscribe\s+selector=\{([^}]+)\}\s+children=\{((?:.|\n|\r)*?)\}\s*\/>/g;
  if (subscribeRegex.test(content)) {
    content = content.replace(subscribeRegex, '<form.Subscribe selector={$1}>\n              {$2}\n            </form.Subscribe>');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + file);
  }
}
