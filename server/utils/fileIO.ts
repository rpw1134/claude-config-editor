import { readFile, writeFile, appendFile, mkdir } from "fs/promises";

// recursively create directory
export async function createDirectory(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory at ${path}:`, error);
    throw error;
  }
}

// simple read
export async function readFileContent(path: string): Promise<string> {
  try {
    const content = await readFile(path, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading file at ${path}:`, error);
    throw error;
  }
}

// helper for later
export async function checkIfFileExists(path: string): Promise<boolean> {
  try {
    await readFile(path, "utf-8");
    return true;
  } catch (e) {
    const error = e as NodeJS.ErrnoException;
    if (error.code === "ENOENT") {
      return false; // File does not exist
    }
    console.error(`Error checking file at ${path}:`, error);
    throw error;
  }
}

// helper for file creation.
export async function createOrAppendToNewFileInExistingDirectory(
  path: string,
  content: string,
): Promise<void> {
  try {
    await writeFile(path, content, "utf-8");
  } catch (error) {
    console.error(`Error writing file at ${path}:`, error);
    throw error;
  }
}

export async function appendToExistingFile(
  path: string,
  content: string,
): Promise<void> {
  try {
    const exists = await checkIfFileExists(path);
    if (exists) {
      await appendFile(path, content, "utf-8");
    } else {
      console.warn(`File at ${path} does not exist. Cannot append.`);
    }
  } catch (error) {
    console.error(`Error appending to file at ${path}:`, error);
    throw error;
  }
}

export async function createFile(path: string, content: string): Promise<void> {
  try {
    await createDirectory(path.substring(0, path.lastIndexOf("/")));
    await writeFile(path, content, "utf-8");
  } catch (error) {
    console.error(`Error creating file at ${path}:`, error);
    throw error;
  }
}
