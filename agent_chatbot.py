'''
<script>
  window.wxOConfiguration = {
    orchestrationID: "20260227-0352-4110-909f-3ff27511395b_20260227-0352-4788-2043-49cd45ae3997",
    hostURL: "https://dl.watson-orchestrate.ibm.com",
    rootElementID: "root",
    chatOptions: {
        agentId: "37784f02-4177-44f4-bcba-6787bc243fee", 
        agentEnvironmentId: "a0f497c7-c69b-4715-9e6e-8b827ae2125d",
    }
  };
  setTimeout(function () {
    const script = document.createElement('script');
    script.src = `${window.wxOConfiguration.hostURL}/wxochat/wxoLoader.js?embed=true`;
    script.addEventListener('load', function () {
        wxoLoader.init();
    });
    document.head.appendChild(script);
  }, 0);                     
</script>
'''