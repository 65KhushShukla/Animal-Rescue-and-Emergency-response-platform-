const git = require('isomorphic-git');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '..');

async function getAllFiles(dir, base = '') {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const relPath = base ? `${base}/${file}` : file;

    // Skip node_modules, .git, .env, dist, uploads, package-lock.json (if wanted), etc.
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'uploads') {
      continue;
    }
    if (file === '.env' || file.startsWith('.env.')) {
      continue;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(await getAllFiles(filePath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

async function performBackup() {
  console.log('================================================================');
  console.log('📦 CREATING BACKUP GIT COMMIT');
  console.log('================================================================\n');

  try {
    // 1. Initialize Repo if needed
    console.log('1. Initializing Git repository...');
    await git.init({ fs, dir: repoDir, defaultBranch: 'main' });
    console.log('   [✓] Git repository initialized at:', repoDir);

    // 2. Discover all project files
    const allFiles = await getAllFiles(repoDir);
    console.log(`\n2. Reviewing files to stage (${allFiles.length} files found):`);

    // Verify .env or node_modules are not included
    const secretsOrNodeModules = allFiles.filter(
      (f) => f.includes('.env') || f.includes('node_modules') || f.includes('dist')
    );
    if (secretsOrNodeModules.length > 0) {
      throw new Error(`SECURITY ALERT: Found sensitive files in file list: ${secretsOrNodeModules.join(', ')}`);
    }

    // 3. Stage relevant files
    console.log('\n3. Staging project files (excluding .env, node_modules, dist, secrets)...');
    for (const file of allFiles) {
      await git.add({ fs, dir: repoDir, filepath: file });
    }
    console.log(`   [✓] Staged ${allFiles.length} files successfully.`);

    // 4. Create Commit
    console.log('\n4. Creating Git commit: "Backup: working Animal Rescue platform lifecycle"...');
    const commitHash = await git.commit({
      fs,
      dir: repoDir,
      author: {
        name: 'Developer',
        email: 'developer@example.com',
      },
      message: 'Backup: working Animal Rescue platform lifecycle',
    });
    console.log(`   [✓] Commit Created! Hash: ${commitHash}\n`);

    // 5. Verify Working Tree Cleanliness & Git Status
    console.log('5. Verifying Git status and commit history...');
    const commits = await git.log({ fs, dir: repoDir, depth: 1 });
    const latestCommit = commits[0];

    console.log('----------------------------------------------------------------');
    console.log('📋 LATEST COMMIT DETAILS:');
    console.log(`   Commit Hash : ${latestCommit.oid}`);
    console.log(`   Author      : ${latestCommit.commit.author.name} <${latestCommit.commit.author.email}>`);
    console.log(`   Date        : ${new Date(latestCommit.commit.author.timestamp * 1000).toISOString()}`);
    console.log(`   Message     : ${latestCommit.commit.message}`);
    console.log('----------------------------------------------------------------');

    // Check status of each file
    let uncommittedCount = 0;
    for (const file of allFiles) {
      const status = await git.status({ fs, dir: repoDir, filepath: file });
      if (status !== 'unmodified') {
        uncommittedCount++;
        console.log(`   [Warning] File ${file} status: ${status}`);
      }
    }

    if (uncommittedCount === 0) {
      console.log('   [✓] Working tree is completely clean (0 uncommitted changes).');
    }

    console.log('\n================================================================');
    console.log('🎉 BACKUP GIT COMMIT COMPLETED AND VERIFIED SUCCESSFULLY!');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ GIT BACKUP FAILED:', err.message);
    process.exit(1);
  }
}

performBackup();
