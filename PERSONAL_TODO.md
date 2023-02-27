# Some quick todos

- [ ] dont strip license files initially..
- [ ] Allow for custom hashing algorithms
- [ ] Add actions from repo (when i make public)

# Performance thingies

- [ ] instead of loading and splitting the db to hand them off to each thread.
      we can load the db once in the main thread, share it with the scheduling
      workers and instead of handing the sections off we just re-share the
      sub-sections. this should theoretically reduce memory footprint but would
      cause the main thread to have to load the entire db into memory... loading
      the entire db into memory is probably still better than loading the entire
      db into memory for each scheduling worker.
- [ ] if a license is already scanned recently in a thread, store it in memory
      (keep a pool), if same license is sent again, use the cached version. this
      will save a lot of time.
- [ ] Licenses at the top are checked quicker. we can re-order frequent licenses all the way to the top to improve performance on those!! Make an array with the licenses we want first ordered at the start etc etc? also make a method which can go and re-order a pool of licenses so that the requested is put all the way at the front?
- [ ] Once a thread decodes its own licenseDB for the first time. can we cache and
  read back from the decoded cache instead of re-decoding? this would save a lot
  of time.


wlhdb -> which license hash database



```mermaid
graph TD;
  add
  calculate
  divide
  multiply
  subtract
  add --> add()
  subtract --> subtract()
  multiply --> multiply()
  divide --> divide()
  calculate --> calculate()
  add --> add()
  subtract --> subtract()
  multiply --> multiply()
  divide --> divide()
  calculate --> calculate()
```