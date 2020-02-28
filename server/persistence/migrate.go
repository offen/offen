package persistence

// Migrate runs the defined database migrations in the given db or initializes it
// from the latest definition if it is still blank.
func (p *persistenceLayer) Migrate() error {
	return p.dal.ApplyMigrations()
}

// ProbeEmpty checks whether the connected database is empty
func (p *persistenceLayer) ProbeEmpty() bool {
	return p.dal.ProbeEmpty()
}
