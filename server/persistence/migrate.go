package persistence

// Migrate runs the defined database migrations in the given db or initializes it
// from the latest definition if it is still blank.
func (p *persistenceLayer) Migrate() error {
	return p.dal.ApplyMigrations()
}
