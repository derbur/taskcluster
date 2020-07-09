package genericworker

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/taskcluster/taskcluster/v32/tools/worker-runner/cfg"
	"github.com/taskcluster/taskcluster/v32/tools/worker-runner/run"
	"gopkg.in/yaml.v2"
)

func TestConfigureRun(t *testing.T) {

	configData := `
        provider:
          providerType: standalone
          rootURL: https://tc.example.com
          clientID: fake
          accessToken: fake
          workerPoolID: pp/ww
          workerGroup: wg
          workerID: wi
        getSecrets: false
        worker:
          implementation: generic-worker
          configPath: a/b/c
          path: d/e/f
        workerConfig:
          abc: def`

	var runnercfg cfg.RunnerConfig
	err := yaml.Unmarshal([]byte(configData), &runnercfg)
	require.NoError(t, err)
	t.Logf("%#v", runnercfg)

	gw, err := New(&runnercfg)
	require.NoError(t, err)

	wc := cfg.NewWorkerConfig()
	wc.Set(
		"workerTypeMetadata",
		map[string]interface{}{
			"stuff": "paper",
		},
	)
	state := &run.State{
		WorkerConfig: wc,
		ProviderMetadata: map[string]interface{}{
			"public-ipv4":       "1.2.3.4",
			"availability-zone": "mars",
		},
	}
	err = gw.ConfigureRun(state)
	require.NoError(t, err)
	expectedWorkerConfig := &cfg.WorkerConfig{}
	require.Equal(t, state.WorkerConfig, expectedWorkerConfig)
}
