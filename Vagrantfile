# -*- mode: ruby -*-
# vi: set ft=ruby :

# ==============================================================================
# Vagrantfile — Biblioteca API
# ==============================================================================
# Define duas máquinas virtuais (VirtualBox):
#   - vm1: Nó de Controle (Ansible) + Cliente de testes HTTP (curl / wget)
#          Memória: 1024 MB | IPv4 Privado: 192.168.56.10 (Classe C)
#   - vm2: Nó Gerenciado / Servidor de Aplicação (Biblioteca API)
#          Memória: 1024 MB | IPv4 Privado: 192.168.56.11 (Classe C)
#
# Rede Privada Classe C: 192.168.56.0/24
# Provedor: VirtualBox
# ==============================================================================

Vagrant.configure("2") do |config|

  # Box base Ubuntu 22.04 LTS (Jammy Jellyfish) para ambas as VMs
  config.vm.box = "ubuntu/jammy64"

  # ============================================================================
  # VM1 — Nó de Controle (Ansible) e Cliente HTTP
  # ============================================================================
  config.vm.define "vm1" do |vm1|
    vm1.vm.hostname = "vm1-controle"

    # Endereço IPv4 privado (Classe C)
    vm1.vm.network "private_network", ip: "192.168.56.10"

    # Sincronização da pasta raiz e dos arquivos de configuração do Ansible
    vm1.vm.synced_folder ".", "/vagrant_data", type: "virtualbox",
      owner: "vagrant",
      group: "vagrant",
      mount_options: ["dmode=775", "fmode=664"]

    vm1.vm.synced_folder "ansible", "/home/vagrant/ansible", type: "virtualbox",
      owner: "vagrant",
      group: "vagrant",
      mount_options: ["dmode=775", "fmode=664"]

    # Configurações do VirtualBox
    vm1.vm.provider "virtualbox" do |vb|
      vb.name   = "Biblioteca-API-VM1-Controle"
      vb.memory = 1024
      vb.cpus   = 1
      vb.gui    = false
    end

    # Provisionamento do Nó de Controle (instalação do Ansible, Python e SSH)
    vm1.vm.provision "shell", path: "vagrant/provision-vm1.sh"
  end

  # ============================================================================
  # VM2 — Nó Gerenciado / Servidor da Aplicação
  # ============================================================================
  config.vm.define "vm2" do |vm2|
    vm2.vm.hostname = "vm2-servidor"

    # Endereço IPv4 privado (Classe C — mesma sub-rede da VM1)
    vm2.vm.network "private_network", ip: "192.168.56.11"

    # Sincronização da pasta da aplicação com a pasta /vagrant_data dentro da VM2
    vm2.vm.synced_folder ".", "/vagrant_data", type: "virtualbox",
      owner: "vagrant",
      group: "vagrant",
      mount_options: ["dmode=775", "fmode=664"]

    # Configurações do VirtualBox
    vm2.vm.provider "virtualbox" do |vb|
      vb.name   = "Biblioteca-API-VM2-Servidor"
      vb.memory = 1024
      vb.cpus   = 1
      vb.gui    = false
    end

    # Provisionamento do Nó de Aplicação
    vm2.vm.provision "shell", path: "vagrant/provision-vm2.sh"
  end

end
