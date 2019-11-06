package persistence

// Migrate runs the defined database migrations in the given db or initializes it
// from the latest definition if it is still blank.
func (r *relationalDatabase) Migrate() error {
	return r.applyMigrations()
}
