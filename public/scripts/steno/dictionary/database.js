//work in progress

let db;

// Check for IndexedDB support
if (!window.indexedDB) {
  console.log("Your browser doesn't support a stable version of IndexedDB.");
}

// Open (or create) the database
export const request = indexedDB.open("stenodictDB", 1);

request.onerror = function (event) {
  console.log("Error opening IndexedDB:", event.target.errorCode);
};

request.onsuccess = function (event) {
  console.log("Database opened successfully");
  db = event.target.result;
};

// Create the schema
request.onupgradeneeded = function (event) {
  let db = event.target.result;
  let objectStore;

  if (!db.objectStoreNames.contains("jsonFiles")) {
    objectStore = db.createObjectStore("jsonFiles", {
      keyPath: "id",
      autoIncrement: true,
    });
    objectStore.createIndex("name", "name", { unique: true });
  }
};

// Add data to the database
export function addData(jsonData) {
  const transaction = db.transaction(["jsonFiles"], "readwrite");
  const objectStore = transaction.objectStore("jsonFiles");

  const request = objectStore.add(jsonData);

  request.onsuccess = function (event) {
    console.log("Data added to the database", event.target.result);
  };

  request.onerror = function (event) {
    console.log("Error adding data", event.target.errorCode);
  };
}

// Retrieve data from the database
export function getData(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["jsonFiles"], "readonly");
    const objectStore = transaction.objectStore("jsonFiles");

    const request = objectStore.get(id);

    request.onsuccess = function (event) {
      console.log("Data retrieved:", request.result);
      resolve(request.result);
    };

    request.onerror = function (event) {
      console.log("Error retrieving data", event.target.errorCode);
      reject(event.target.errorCode);
    };
  });
}

// Delete data from the database
export function deleteData(id) {
  const transaction = db.transaction(["jsonFiles"], "readwrite");
  const objectStore = transaction.objectStore("jsonFiles");

  const request = objectStore.delete(id);

  request.onsuccess = function (event) {
    console.log("Data deleted");
  };

  request.onerror = function (event) {
    console.log("Error deleting data", event.target.errorCode);
  };
}

// Usage Example
const jsonData = {
  name: "exampleFile",
  content: {
    key: "value",
  },
};

// Ensure the database is open before adding data
request.onsuccess = function (event) {
  db = event.target.result;
  // addData(jsonData);
  // jsonData.name = "hello1";
  // getData(1); // Assuming the ID is 1 for demonstration purposes
  // deleteData(1); // Assuming the ID is 1 for demonstration purposes
};
